import express from 'express';
import { authController } from '../controllers/authController.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = express.Router();

/**
 * Authentication routes
 */

// POST /auth/signup - Register a new user
router.post('/signup', authController.signUp);

// POST /auth/signin - Sign in a user
router.post('/signin', authController.signIn);

// GET /auth/session - Get current user session (requires auth)
router.get('/session', verifyAuth, authController.getSession);

// POST /auth/signout - Sign out user (requires auth)
router.post('/signout', verifyAuth, authController.signOut);

export default router;
