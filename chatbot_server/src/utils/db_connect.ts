import dotenv from 'dotenv';
dotenv.config();
import mongoose from "mongoose";

export default async function connectToDB() {
    try {
        if(!process.env.MONGODB_CONNECTIONSTRING) throw new Error('No mongodb connection string detected');
        await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
        console.log('DB Connected');
    } catch(error) {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    }
}