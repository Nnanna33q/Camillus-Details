import { body } from "express-validator";

export const validateContactForm = [
    body('hp').custom((hp) => hp === '').withMessage('An unexpected error occurred'),
    body('name').trim().isString().notEmpty().withMessage('Please enter your name').isLength({ min: 1, max: 50 }).withMessage('Please enter a valid name (1 - 50 characters)'),
    body('phone').trim().isString().notEmpty().withMessage('Please enter your phone number').isLength({ min: 7, max: 20 }).withMessage('Please enter a valid phone number'),
    body('email').trim().isString().notEmpty().withMessage('Please enter your email address').isLength({ min: 5, max: 254 }).withMessage('Please enter a valid email address').isEmail().withMessage('Please enter a valid email address'),
    body('service').trim().isString().notEmpty().withMessage('Please select a service').custom((service) => {
        if(service === 'Interior Detail' || service === 'Exterior Detail' || service === 'Full Detail') return true;
        return false;
    }).withMessage('We do not offer this service'),
    body('message').trim().isString().notEmpty().withMessage('Please fill this field').isLength({ min: 10 }).withMessage('Message is too short (minimum 10 characters)').isLength({ max: 4000 }).withMessage('Message is too long (Maximum 4000 characters)')
]