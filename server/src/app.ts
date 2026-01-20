import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import ContactRouter from './routes/contact.js';
import PingRouter from './routes/ping.js';

const whitelistedOrigins = process.env.NODE_ENVIRONMENT === 'production' ? ['https://camillusdetails.online', 'https://camillusdetails.vercel.app'] : ['http://127.0.0.1:5500']

const app = express()

app.enable('trust-proxy');

app.use(cors({
    origin: whitelistedOrigins
}))

app.use(express.json());

app.use(ContactRouter) // Handles Contact Submissions

// Wakes render when user loads contact page
// It speeds up contact form submission
app.use(PingRouter)

app.listen(process.env.PORT || 3000, () => console.log(`App is listening on PORT ${process.env.PORT || 3000}`))