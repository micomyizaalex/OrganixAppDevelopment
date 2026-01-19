import { authService } from '../services/authService.js';
import { auditService } from '../services/auditService.js';

/**
 * Controller for authentication operations
 */
export const authController = {
  /**
   * Sign up a new user
   */
  async signUp(req, res) {
    try {
      const { email, password, name, role } = req.body;

      // Validation
      if (!email || !password || !name || !role) {
        return res.status(400).json({
          error: 'Missing required fields: email, password, name, role'
        });
      }

      const user = await authService.signUp(email, password, name, role);

      // Log audit event
      await auditService.logEvent(user.userId, 'USER_SIGNUP', { role });

      res.json({
        success: true,
        user: { id: user.userId, email: user.email, name: user.name, role: user.role },
        message: role === 'hospital' || role === 'sponsor'
          ? 'Account created. Awaiting admin approval.'
          : 'Account created successfully.'
      });

    } catch (error) {
      console.error('Signup error:', error);
      res.status(400).json({ error: error.message || 'Signup failed' });
    }
  },

  /**
   * Sign in a user
   */
  async signIn(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      const result = await authService.signIn(email, password);

      // Log audit event
      await auditService.logEvent(result.user.id, 'USER_SIGNIN');

      res.json({
        success: true,
        accessToken: result.accessToken,
        user: result.user
      });

    } catch (error) {
      console.error('Signin error:', error);
      
      if (error.needsApproval) {
        return res.status(403).json({
          error: error.message,
          needsApproval: true
        });
      }

      res.status(401).json({ error: error.message || 'Sign in failed' });
    }
  },

  /**
   * Get current user session
   */
  async getSession(req, res) {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        approved: req.user.approved
      }
    });
  },

  /**
   * Sign out user
   */
  async signOut(req, res) {
    // Log audit event
    await auditService.logEvent(req.user.id, 'USER_SIGNOUT');
    res.json({ success: true, message: 'Signed out successfully' });
  }
};
