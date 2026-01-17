import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';

export async function summarizeMessages(messages: { user: String, llm: string }[]): Promise<string> {
    const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'nvidia/nemotron-nano-9b-v2:free',
        messages: [
            {
                role: 'user',
                content: `Get the summary of this conversations between a user and an llm (you): ${messages}`
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