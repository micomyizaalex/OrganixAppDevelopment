// Supabase configuration
export const getSupabaseConfig = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rxnzqaczhtxewwysgbdb.supabase.co';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bnpxYWN6aHR4ZXd3eXNnYmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MjUyNTAsImV4cCI6MjA4NDQwMTI1MH0.JybMlQMq93eI8ckkNiN7uDzZPPz91ZNF1RqQ4b20K28';
  
  return {
    supabaseUrl,
    anonKey,
    apiUrl
  };
};
