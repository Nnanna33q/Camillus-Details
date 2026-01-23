import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import { createConversation, updateConversation } from './conversation.js';
import { getSummary, formatConversation } from './format_conversation.js';
import sendMail from './mail.js';
import type { TConversation } from './types.js';
import type { Request, Response } from 'express';

export async function summarizeMessages(messages: { user: String, llm: string }[], prevSummary?: string): Promise<string> {
    const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'nvidia/nemotron-nano-9b-v2:free',
        messages: [
            {
                role: 'user',
                content: `Generate a brief and updated summary of the conversation using these messages: ${messages} and the previous summary: ${prevSummary}. Return only the updated summary.`
            }
        ]
    }, {
        headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
        }
    })
    return aiResponse.data.choices[0].message.content
}

export async function getIntent(prompt: string) {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'nvidia/nemotron-nano-9b-v2:free',
        messages: [
            {
                role: 'user',
                content: `Classify the user's message into one of these intents: "general_question", "booking_request". User's message: ${prompt}. You must output either "general_question" or "booking_request"`
            }
        ]
    }, {
        headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
        }
    })
    return response.data.choices[0].message.content
}

export async function handleGeneralQuestion(referenceData: string, conversation: TConversation | null, prompt: string, sessionId: string, res: Response) {
    
    const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'nvidia/nemotron-nano-9b-v2:free',
        messages: [
            {
                role: 'system',
                content: 'You are a customer support assistant for Camillus Details (a car detailing company). Answer questions politely, clearly, professionally and make sure your response is short. Do not invent services, prices, or availability. If unsure about a user’s request, tell them you don’t have that information and suggest contacting the business. Maintain a friendly and helpful tone, and avoid mentioning internal systems, APIs, or AI models. Do not talk to the user in third person'
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
    conversation ? updateConversation(prompt, aiResponse.data.choices[0].message.content, conversation, sessionId) : createConversation(prompt, aiResponse.data.choices[0].message.content, sessionId);
    res.status(200).json({ success: true, msg: aiResponse.data.choices[0].message.content });
}

export async function handleBookingRequest(conversation: TConversation | null, prompt: string, req: Request) {
    if (req.session.bookingStep === undefined) {
        const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'nvidia/nemotron-nano-9b-v2:free',
            messages: [
                {
                    role: 'system',
                    content: `You are a customer support assistant for Camillus Details (a car detailing company). Answer questions politely, clearly, professionally. DO NOT ask for details. Avoid mentioning internal systems, APIs, or AI models. Do not talk to the user in third person
                              Only Ask if they would like to proceed with a booking request and nothing else.`
                },
                {
                    role: 'user',
                    content: `Answer the following user prompt using the provided summary and conversation if any.\nUser's Prompt: "${prompt}".\n 
                        ${conversation ? formatConversation(conversation) : ''} \n
                        ${conversation ? getSummary(conversation) : ''}`
                }
            ]
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            }
        })

        req.session.bookingStep = 'confirmation';
        return aiResponse.data.choices[0].message.content;
    }

    if (req.session.bookingStep === 'confirmation') {
        const aiConfirmationResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'nvidia/nemotron-nano-9b-v2:free',
            messages: [
                {
                    role: 'system',
                    content: `You are a customer support assistant for Camillus Details (a car detailing company). Answer questions politely, clearly, professionally and make sure your response is short. Avoid mentioning internal systems, APIs, or AI models.
                    Analyze the user's message and determine if they are confirming to start a booking request. ALWAYS return a valid JSON object with two fields: "sentiment": "yes", "no" or "unclear" and "llmResponse": (The text the bot should respond to the prompt with. Only ask for user's name and preferred booking time, service and email if sentiment is "yes")`
                },
                {
                    role: 'user',
                    content: `Answer the following user prompt using the provided summary and conversation if any.\nUser's Prompt: "${prompt}".\n 
                        ${conversation ? formatConversation(conversation) : ''} \n
                        ${conversation ? getSummary(conversation) : ''}`
                }
            ]
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            }
        })

        try {
            const { sentiment, llmResponse } = JSON.parse(aiConfirmationResponse.data.choices[0].message.content);
            if (sentiment === 'yes') req.session.bookingStep = 'data collection';
            if (sentiment !== 'yes') req.session.bookingStep = undefined;
            return llmResponse;
        } catch(error) {
            // LLM probably didn't return valid json
            req.session.bookingStep = 'confirmation';
            return 'Oops — something went wrong on our end. Please send your message again.'
        }
    }

    if (req.session.bookingStep === 'data collection') {
        const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'nvidia/nemotron-nano-9b-v2:free',
            messages: [
                {
                    role: 'system',
                    content: `You are a customer support assistant for Camillus Details, a car detailing business and you're currently handling a booking request and not confirming bookings.
                              Respond politely, professionally, and concisely. Do not mention internal systems, APIs, or AI.

                              From the user’s message, extract useful info (name, email, service type, preferred time).
                              ALWAYS return a valid JSON object with exactly two fields:
                              - "data": the extracted information as a string (null if any or all requested info is not provided)
                              - "llmResponse": the message to send back to the user (The business will review their booking request and get back them)`
                },
                {
                    role: 'user',
                    content: `Answer the following user prompt using the provided summary and conversation if any.\nUser's Prompt: "${prompt}".\n 
                        ${conversation ? formatConversation(conversation) : ''} \n
                        ${conversation ? getSummary(conversation) : ''}`
                }
            ]
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            }
        })

        try {
            const { data, llmResponse } = JSON.parse(aiResponse.data.choices[0].message.content);
            if(data) {
                await sendMail(data, prompt);
                req.session.bookingStep = undefined;
                return llmResponse
            }
            req.session.bookingStep = 'data collection';
            return 'To help us assist you, please provide all info (your name, email, service you’re interested in, and preferred date or time)'
        } catch(error) {
            req.session.bookingStep = 'data collection';
            return 'Oops — something went wrong on our end. Please send your message again.'
        }
    }
}