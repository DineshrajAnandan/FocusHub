import { createClient } from '@supabase/supabase-js';

// Load Supabase credentials from local settings overrides or Vite env variables
const supabaseUrl = 
  localStorage.getItem('VITE_SUPABASE_URL') || 
  (import.meta.env.VITE_SUPABASE_URL as string) || 
  'https://mockprojectid.supabase.co';

const supabaseAnonKey = 
  localStorage.getItem('VITE_SUPABASE_ANON_KEY') || 
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockKey';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
