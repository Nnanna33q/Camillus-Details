import type { Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';

const host = 'smtp.resend.com';
const port = 465

export default async function sendMail(req: Request, res: Response) {
    try {
        const { name, phone, email, service, message } = req.body;
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
            subject: 'New Contact Form Submission',
            text: `Someone has reached out through your contact form\n\n\nName: ${name}\n\nPhone: ${phone}\n\nEmail: ${email}\n\nService: ${service}\n\nMessage: ${message}`
        })
        res.status(201).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            errorMessage: error instanceof Error ? error.message : 'An unexpected error occurred',
        })
    }
}