import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import connectToDB from './utils/db_connect.js';
import insertKbVectors from './utils/vectorize_kb.js';
import { rateLimit } from 'express-rate-limit';
import axios from 'axios';
import getVector from './utils/vectorize.js';
import Kb from './schemas/knowledgebase.js';
import Conversation from './schemas/conversation.js';
import similarity from 'compute-cosine-similarity';
import session from 'express-session';
import { createConversation, updateConversation } from './utils/conversation.js';
import { formatConversation, getSummary } from './utils/format_conversation.js';

declare module 'express-session' {
    interface SessionData {
        initialized: true,
        interactionCount: number
    }
}

if(!process.env.SESSION_SECRET) throw new Error('No session secret detected');

const limiter = rateLimit({
    windowMs: 60000,
    limit: 20
})

const PORT = process.env.PORT ? process.env.PORT : 3000;
const app = express();
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET
}))
connectToDB().then(() => insertKbVectors());
app.use(express.json());

class ChatError extends Error {};

app.post('/', limiter, async (req, res) => {
    try {
        req.session.initialized = true;
        console.log(req.session);
        const { prompt } = req.body;
        if(!prompt) throw new ChatError('Please add a prompt');

        const [kbs, conversation] = await Promise.all([Kb.find(), Conversation.findOne({ sessionId: req.session.id })]);

        const scoredKnowledgeChunks = await Promise.all(kbs.map(async k => {
            return { score: similarity(await getVector(prompt), k.vector), text: k.text }
        }))
        const sortedKC = scoredKnowledgeChunks.sort((a, b) => {
            if(typeof a.score === 'number' && typeof b.score === 'number') {
                return b.score - a.score;
            }
            throw new Error('Invalid score type');
        })
        let referenceData = '';
        sortedKC.slice(0, 3).forEach(s => referenceData += s.text);
        
        const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'nvidia/nemotron-nano-9b-v2:free',
            messages: [
                {
                    role: 'system',
                    content: 'You are a customer support assistant for Wash & Wax. Answer questions politely, clearly, professionally and briefly. Do not invent services, prices, or availability. If unsure about a user’s request, tell them you don’t have that information and suggest contacting the business. Maintain a friendly and helpful tone, and avoid mentioning internal systems, APIs, or AI models. Do not talk to the user in third person'
                },
                {
                    role: 'user',
                    content: `Answer the following user question using the provided knowledge base and summary if any.\nQuestion: "${prompt}".\n 
                    Knowledge base: "${referenceData}".\n ${conversation ? formatConversation(conversation) : ''} \n
                    ${conversation ? getSummary(conversation) : ''}`
                }
            ]
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            }
        })
        conversation ? updateConversation(prompt, aiResponse.data.choices[0].message.content, conversation, req.session.id) : createConversation(prompt, aiResponse.data.choices[0].message.content, req.session.id);
        res.status(200).json({ success: true, msg: aiResponse.data.choices[0].message.content });
    } catch(error) {
        console.error(error);
        res.status(error instanceof ChatError ? 400 : 500).json({
            success: false,
            errorMessage: error instanceof Error ? error.message : 'I’m temporarily unavailable due to a technical issue. Please try again shortly.'
        })
    }
})

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));