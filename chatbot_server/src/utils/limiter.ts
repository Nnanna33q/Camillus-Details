import rateLimit from "express-rate-limit"

export const chatLimiter = rateLimit({
    windowMs: 60000,
    limit: 5,
    message: {
        success: false,
        errorMessage: 'You’re sending messages too quickly. Please wait a bit before sending more.'
    }
})

export const messagesLimiter = rateLimit({
    windowMs: 60000,
    limit: 10,
    message: {
        success: false,
        errorMessage: 'You’re refreshing or visiting this page too often. Please wait a moment before trying again.'
    }
})

export const basicLimiter = rateLimit({
    windowMs: 60000,
    limit: 10,
    message: {
        success: false,
        errorMessage: 'You are making too many requests'
    }
})