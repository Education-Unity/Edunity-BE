import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || ''; // Dùng Anon Key là đủ cho Auth

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false, // Tắt tự động refresh ở server side (Frontend lo hoặc gọi API riêng)
    persistSession: false,   // Server không cần lưu session vào storage
  },
});

export default supabase;