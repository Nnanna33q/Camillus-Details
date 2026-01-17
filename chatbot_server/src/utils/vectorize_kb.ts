import dotenv from 'dotenv';
dotenv.config();
import knowledgeBase from '../../knowledgebase.json' with { type: "json" };
import Kb from '../schemas/knowledgebase.js';
import getVector from './vectorize.js';

export default async function insertKbVectors() {
    try {
        const kbs = await Kb.find();
        if(kbs.length === 0) { // No knowledge base
            await Promise.all(
                knowledgeBase.map(async k => {
                    new Kb({
                        text: k.text,
                        category: k.category,
                        vector: await getVector(k.text)
                    }).save()
                })
            )
        }
    } catch(error) {
        // Failed to vectorize and store knowledge base
        console.log(error instanceof Error ? error.message : error);
        process.exit(1);
    }
}