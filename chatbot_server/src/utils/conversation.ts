import Conversation from "../schemas/conversation.js";
import { TConversation } from "./types.js";
import { summarizeMessages } from "./llm_interactions.js";

export async function createConversation(userPrompt: string, llmResponse: string, bookingStep: string) {
    const { _id } = await new Conversation({
        messages: [{
            user: userPrompt,
            llm: llmResponse
        }],
        summary: '',
        bookingStep: bookingStep
    }).save()
    console.log(_id);
    return _id;
}

export async function updateConversation(userPrompt: string, llmResponse: string, conversation: TConversation, id: string, bookingStep: string) {
    if(conversation.messages.length === 10) {
        // Get Summary of last 7 messages
        const oldestMessages = conversation.messages.filter((m, i) => i < 7);
        const latestMessages = conversation.messages.filter((m, i) => i >= 7);
        await Conversation.findByIdAndUpdate(id, { 
            messages: [...latestMessages, { user: userPrompt, llm: llmResponse }],
            summary: await summarizeMessages(oldestMessages, conversation.summary),
            bookingStep: bookingStep
        })
    } else {
        await Conversation.findByIdAndUpdate(id, { 
            messages: [...conversation.messages, { user: userPrompt, llm: llmResponse }],
            summary: conversation.summary,
            bookingStep: bookingStep
        })
    }
}