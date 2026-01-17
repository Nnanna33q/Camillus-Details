import axios from "axios";

export default async function getVector(text: string): Promise<number[]> {
    const response = await axios.post('https://openrouter.ai/api/v1/embeddings', {
        input: text,
        model: 'openai/text-embedding-3-small'
    }, {
        headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
        }
    })
    return response.data.data[0].embedding
}