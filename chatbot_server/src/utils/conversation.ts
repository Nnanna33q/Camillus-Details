import Conversation from "../schemas/conversation.js";
import axios from 'axios';
import { TConversation } from "./types.js";
import { summarizeMessages } from "./llm_interactions.js";

export async function createConversation(userPrompt: string, llmResponse: string, sessionId: string) {
    await new Conversation({
        sessionId: sessionId,
        messages: [{
            user: userPrompt,
            llm: llmResponse
        }],
        summary: ''
    }).save()
}

export async function updateConversation(userPrompt: string, llmResponse: string, conversation: TConversation, sessionId: string) {
    if(conversation.messages.length === 10) {
        // Get Summary of last 7 messages
        const oldestMessages = conversation.messages.filter((m, i) => i < 7);
        const latestMessages = conversation.messages.filter((m, i) => i >= 7);
        await Conversation.findOneAndUpdate({ sessionId: sessionId }, { 
            messages: [...latestMessages, { user: userPrompt, llm: llmResponse }],
            summary: await summarizeMessages(oldestMessages)
        })
    } else {
        await Conversation.findOneAndUpdate({ sessionId: sessionId }, { 
            messages: [...conversation.messages, { user: userPrompt, llm: llmResponse }],
            summary: conversation.summary
        })
    }
}