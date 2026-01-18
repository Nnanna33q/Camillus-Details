import express from 'express';
import rateLimit from 'express-rate-limit';

const PingRouter = express.Router();

PingRouter.get('/ping', rateLimit({ windowMs: 1000 * 60 * 10, limit: 2 }), (req, res) => res.status(200).json('Pong'));

export default PingRouter