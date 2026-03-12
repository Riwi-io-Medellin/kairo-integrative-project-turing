import { Router } from 'express';
import {
  register, login, logout, checkAuth, verifyOtp, resendOtp,
  updateFirstLoginStatus, updateUserProfile, socialAuthSuccess,
} from '../controllers/authControllers.js';
import passport from '../config/passport.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', checkAuth);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.patch('/onboarding', updateFirstLoginStatus);
router.patch('/profile', updateUserProfile);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: true }), socialAuthSuccess);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { session: true }), socialAuthSuccess);

export default router;
