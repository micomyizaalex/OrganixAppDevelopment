import { supabase } from '../config/database.js';

/**
 * Service layer for authentication operations
 */
export const authService = {
  /**
   * Create a new user with role-based profile
   */
  async signUp(email, password, name, role) {
    // Validate role
    const validRoles = ['patient', 'donor', 'hospital', 'sponsor', 'admin'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    });

    if (authError) {
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    const userId = authData.user.id;
    const approved = role === 'patient' || role === 'donor';

    try {
      // Insert into users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          name,
          role,
          approved
        });

      if (userError) throw userError;

      // Create role-specific profile
      await this.createRoleProfile(userId, role);

      return {
        userId,
        email,
        name,
        role,
        approved
      };
    } catch (error) {
      // Rollback auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId);
      throw new Error('Failed to create user profile');
    }
  },

  /**
   * Create role-specific profile
   */
  async createRoleProfile(userId, role) {
    switch (role) {
      case 'patient':
        await supabase.from('patients').insert({ user_id: userId });
        break;
      case 'donor':
        await supabase.from('donors').insert({ user_id: userId });
        break;
      case 'hospital':
        await supabase.from('hospitals').insert({ user_id: userId, approved: false });
        break;
      case 'sponsor':
        await supabase.from('sponsors').insert({ user_id: userId, approved: false });
        break;
    }
  },

  /**
   * Sign in user
   */
  async signIn(email, password) {
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(`Sign in failed: ${error.message}`);
    }

    const userId = data.user.id;

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      throw new Error('User profile not found');
    }

    // Check if user needs approval
    if ((userProfile.role === 'hospital' || userProfile.role === 'sponsor') && !userProfile.approved) {
      const error = new Error('Account pending admin approval');
      error.needsApproval = true;
      throw error;
    }

    return {
      accessToken: data.session.access_token,
      user: {
        id: userId,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role
      }
    };
  }
};
