import { Router } from 'express';
import { body } from 'express-validator';
import * as codeController from '../controllers/code.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

router.post('/execute',
    authMiddleware.authUser,
    body('code').isString().withMessage('Code is required'),
    body('language').isString().withMessage('Language is required'),
    codeController.executeCode
);

export default router;