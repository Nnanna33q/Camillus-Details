import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import { createConversation, updateConversation } from './conversation.js';
import { getSummary, formatConversation } from './format_conversation.js';
import sendMail from './mail.js';
import type { TConversation } from './types.js';
import type { Response } from 'express';

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

export async function handleGeneralQuestion(referenceData: string, conversation: TConversation | null, prompt: string, res: Response) {

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
    conversation && await updateConversation(prompt, aiResponse.data.choices[0].message.content, conversation, conversation._id, 'unset');
    const id = !conversation && await createConversation(prompt, aiResponse.data.choices[0].message.content, 'unset');
    res.status(200).json({ success: true, msg: aiResponse.data.choices[0].message.content, id });
}

export async function handleBookingRequest(conversation: TConversation | null, prompt: string) {
    if (!conversation || conversation.bookingStep === 'unset') {
        const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'nvidia/nemotron-nano-9b-v2:free',
            messages: [
                {
                    role: 'system',
                    content: `You are a customer support assistant for Camillus Details (a car detailing company).
                              Only Ask if they would like to proceed with a booking request. Do not tell them to provide any details and do not add extra commentary`
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

        return { llmResponse: aiResponse.data.choices[0].message.content, bookingStep: 'confirmation' }
    }

    if (conversation.bookingStep === 'confirmation') {
        const aiConfirmationResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'nvidia/nemotron-nano-9b-v2:free',
            messages: [
                {
                    role: 'system',
                    content: `You are a polite, professional customer support assistant for Camillus Details. 
                    Always respond in JSON:

                    {
                        "sentiment": "yes|no|unclear",
                        "llmResponse": "The text you should reply to the user."
                    }

                    Rules:
                    - If sentiment = "yes": ask for user's name, preferred booking time, service, and email
                    - If sentiment = "no": give a short, polite answer
                    - If sentiment = "unclear": give a neutral, short answer
                    - DO NOT include any text outside JSON

                    User's prompt: ${prompt}\n
                    ${conversation ? formatConversation(conversation) : ''} \n
                    ${conversation ? getSummary(conversation) : ''}
`
                },
            ]
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            }
        })

        try {
            const { sentiment, llmResponse } = JSON.parse(aiConfirmationResponse.data.choices[0].message.content);
            return { llmResponse, bookingStep: sentiment === 'yes' ? 'data collection' : 'unset' };
        } catch (error) {
            console.error(error);
            console.log(aiConfirmationResponse.data.choices[0].message.content)
            // LLM probably didn't return valid json
            return { llmResponse: 'Oops — something went wrong on our end. Please send your message again.', bookingStep: 'confirmation' }
        }
    }

    if (conversation.bookingStep === 'data collection') {
        const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'nvidia/nemotron-nano-9b-v2:free',
            messages: [
                {
                    role: 'system',
                    content: `You are a polite, professional customer support assistant for Camillus Details (a car detailing business). 
                    You are currently handling a booking request. Do not confirm bookings. 
                    Do NOT mention internal systems, APIs, or AI.

                    From the user's message, extract the following information if provided:
                    - Name
                    - Email
                    - Service type
                    - Preferred time

                    ALWAYS RETURN ONLY VALID JSON with exactly two fields:

                    {
                        "data": "Extracted info as a string, or null if any/all info missing",
                        "llmResponse": "The message to send back to the user: politely state that the booking will be reviewed."
                    }

                    Examples:

                    message: "Hi, my name is John, I want a full detail tomorrow, email john@example.com"
                    Output: {"data": "John, john@example.com, full detail, tomorrow", "llmResponse": "Thanks John! We have received your booking request and will review it shortly."}

                    message: "I’d like a wash for my SUV"
                    Output: {"data": null, "llmResponse": "Thanks! We have received your booking request and will review it shortly."}

                    Now analyze this message: ${prompt}\n
                    ${conversation ? formatConversation(conversation) : ''} \n
                    ${conversation ? getSummary(conversation) : ''}
`
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
            if (data) {
                await sendMail(data, prompt);
                return { llmResponse, bookingStep: 'unset' }
            }
            return { llmResponse: 'To help us assist you, please provide all info (your name, email, service you’re interested in, and preferred date or time)', bookingStep: 'data collection' }
        } catch (error) {
            console.error(error);
            console.log(aiResponse.data.choices[0].message.content);
            return { llmResponse: 'Oops — something went wrong on our end. Please send your message again.', bookingStep: 'data collection' }
        }
    }
    return { llmResponse: 'An unexpected error occurred. Please contact the developer if issue persists', bookingStep: 'unset' }
}