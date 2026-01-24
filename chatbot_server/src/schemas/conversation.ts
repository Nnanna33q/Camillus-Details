import mongoose from "mongoose";
import type { TConversation } from "../utils/types.js";

export const conversationSchema = new mongoose.Schema<TConversation>({
    messages: [
        {
            user: String,
            llm: String
        }
    ],
    summary: String,
    bookingStep:  String,
}, { timestamps: true })

const Conversation = mongoose.model<TConversation>('Conversation', conversationSchema);

export default Conversation;