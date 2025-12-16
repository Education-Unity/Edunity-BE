import supabase from '../config/supabase';
import prisma from '../config/prisma';
import { AuthError } from '@supabase/supabase-js';

export class AuthService {
  // 1. Đăng ký
  static async register(email: string, password: string, fullName: string, role: 'student' | 'teacher' = 'student') {
    // 1. Gọi Supabase tạo User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName } // Lưu meta data vào Auth luôn cho chắc
      }
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Đăng ký thất bại, không có User ID");

    // 2. Gọi Prisma tạo hoặc cập nhật Profile (SỬA ĐOẠN NÀY)
    // Dùng upsert để tránh lỗi "Unique constraint failed" nếu Trigger đã chạy trước
    const newProfile = await prisma.profiles.upsert({
      where: { 
        id: authData.user.id 
      },
      update: {
        // Nếu tồn tại rồi thì update thông tin này
        email: email,
        full_name: fullName,
        updated_at: new Date()
      },
      create: {
        // Nếu chưa tồn tại thì tạo mới
        id: authData.user.id,
        email: email,
        full_name: fullName,
        app_role: 'normal_user',
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    return { user: authData.user, profile: newProfile };
  }

  // 2. Đăng nhập
  static async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    // Trả về Access Token & Refresh Token từ Supabase
    return {
      user: data.user,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  }

  // 3. Refresh Token
  static async refreshToken(refreshToken: string) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) throw new Error(error.message);

    return {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
    };
  }

  // 4. Logout
  static async logout(accessToken: string) {
    const { error } = await supabase.auth.admin.signOut(accessToken);
    if (error) throw new Error(error.message);
    return true;
  }
}