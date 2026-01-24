import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import connectToDB from './utils/db_connect.js';
import { handleGeneralQuestion, handleBookingRequest } from './utils/llm_interactions.js';
import insertKbVectors from './utils/vectorize_kb.js';
import { getIntent } from './utils/llm_interactions.js';
import getVector from './utils/vectorize.js';
import similarity from 'compute-cosine-similarity';
import Kb from './schemas/knowledgebase.js';
import Conversation from './schemas/conversation.js';
import { createConversation, updateConversation } from './utils/conversation.js';
import type { TMessage } from './utils/types.js';
import cors from 'cors';
import { chatLimiter, messagesLimiter, basicLimiter } from './utils/limiter.js';


if (!process.env.MONGODB_CONNECTIONSTRING) {
    console.error('No mongodb connection uri detected');
    process.exit(1);
}

const whitelistedOrigins = process.env.NODE_ENVIRONMENT === 'production' ? ['https://chat.camillusdetails.online', 'https://camillusdetails-chat.vercel.app'] : ['http://localhost:5173'];
const PORT = process.env.PORT ? process.env.PORT : 4000;
const app = express();

app.set('trust-proxy', 1);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        if (whitelistedOrigins.indexOf(origin) === -1) {
            callback(new Error('This origin is not allowed to make this request'));
        } else {
            callback(null, true);
        }
    }
}))

connectToDB().then(() => insertKbVectors());
app.use(express.json());

class ChatError extends Error { };

app.post('/', chatLimiter, async (req, res) => {
    try {
        const { prompt } = req.body;
        const id = req.headers['id'];
        if (!prompt) throw new ChatError('Please add a prompt');
        if (prompt.length > 500) throw new ChatError('Message too long (over 500 characters). Please shorten it and try again');

        const [kbs, conversation, intent, vectorPrompt] = await Promise.all([Kb.find(), Conversation.findById(id), getIntent(prompt), getVector(prompt)]);

        const scoredKnowledgeChunks = await Promise.all(kbs.map(k => {
            return { score: similarity(vectorPrompt, k.vector), text: k.text }
        }))
        const sortedKC = scoredKnowledgeChunks.sort((a, b) => {
            if (typeof a.score === 'number' && typeof b.score === 'number') {
                return b.score - a.score;
            }
            throw new Error('Invalid score type');
        })
        let referenceData = '';
        sortedKC.slice(0, 3).forEach(s => referenceData += s.text);

        if (intent.includes('general_question') && (!conversation || conversation.bookingStep === 'unset')) {
            handleGeneralQuestion(referenceData, conversation, prompt, res);
        } else {
            const { llmResponse, bookingStep } = await handleBookingRequest(conversation, prompt)
            conversation && updateConversation(prompt, llmResponse, conversation, conversation._id, bookingStep);
            const id = !conversation && createConversation(prompt, llmResponse, bookingStep);
            res.status(200).json({ success: true, msg: llmResponse, id });
        }
    } catch (error) {
        console.error(error);
        if (error instanceof ChatError) {
            res.status(400).json({ success: false, errorMessage: error.message, id: null });
        } else {
            res.status(500).json({ success: false, errorMessage: 'Oops - Something went wrong. Please try again later', id: null })
        }
    }
})

app.post('/resolve', basicLimiter, async (req, res) => { // Destroys session and deletes conversation
    try {
        const id = req.headers['id'];
        id && await Conversation.findByIdAndDelete(id);
        res.status(200).json({ status: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, errorMessage: 'Oops! Failed to resolve chat' });
    }
})

app.get('/ping', basicLimiter, (req, res) => res.json({ success: true }))

app.get('/messages', messagesLimiter, async (req, res) => {
    try {
        const id = req.headers['id'];
        if (typeof id !== 'string') {
            res.status(200).json({ success: true, messages: [] });
            return;
        }
        const conversation = await Conversation.findById(id);

        if (!conversation) {
            res.status(200).json({ success: true, messages: [] });
            return;
        }

        const messages: TMessage[] = [];

        conversation.messages.forEach((m, i) => {
            const values = [m.user, m.llm];
            values.forEach((v, i) => messages.push({
                id: messages.length + 1,
                role: i === 0 ? 'user' : 'assistant',
                content: v,
                loadingState: false
            }))
        })
        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, errorMessage: error instanceof Error ? error.message : 'An unexpected error occurred' });
    }
})

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));