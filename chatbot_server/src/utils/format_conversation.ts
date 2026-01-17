import type { TConversation } from "./types.js"

export function formatConversation(conversation: TConversation) {
    return `Your conversation history: ${conversation.messages}`
}

export function getSummary(conversation: TConversation) {
    return `Conversation Summary: ${conversation.summary}`
}