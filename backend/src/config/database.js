import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Supabase client configuration
 * Uses service role key for server-side operations with elevated privileges
 */
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Database configuration
 */
export const dbConfig = {
  url: process.env.SUPABASE_URL,
  // Service role key is kept private in env
};
