import express from 'express';
import checkErrors from '../utils/check-errors.js';
import { validateContactForm } from '../utils/validator.js';
import sendMail from '../utils/mail.js';
import rateLimit from 'express-rate-limit';

const ContactRouter = express.Router();

ContactRouter.post('/contact', rateLimit({ windowMs: 1000 * 60 * 60, limit: 5 }), validateContactForm, checkErrors, sendMail)

export default ContactRouter;