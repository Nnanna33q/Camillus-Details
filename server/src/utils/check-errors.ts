import { validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";

export default function checkErrors(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = errors.array()[0];
        res.status(400).json({ 
            success: false, 
            errorMessage: error ? error.msg : '',
        });
        return;
    }
    next();
}