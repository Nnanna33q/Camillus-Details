import mongoose from "mongoose";
import type { TConversation } from "../utils/types.js";

export const conversationSchema = new mongoose.Schema<TConversation>({
    sessionId: {
        type: String,
        unique: true,
        required: true
    },
    messages: [
        {
            user: String,
            llm: String
        }
    ],
    summary: String
}, { timestamps: true })

const Conversation = mongoose.model<TConversation>('Conversation', conversationSchema);

export default Conversation;