import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';

const host = 'smtp.resend.com';
const port = 465

export default async function sendMail(data: string, prompt: string) {
    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: true,
        auth: {
            user: process.env.USERNAME,
            pass: process.env.PASSWORD
        }
    })
    await transporter.sendMail({
        from: `Camillus Details <${process.env.SENDER_EMAIL}>`,
        to: process.env.OWNER_EMAIL_ADDRESS,
        subject: 'New Booking Request',
        text: `${data}\n\n\nLead's message: "${prompt}"`
    })
}