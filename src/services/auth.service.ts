import supabase from '../config/supabase';
import prisma from '../config/prisma';
import { AuthError } from '@supabase/supabase-js';

export class AuthService {
    // 1. Đăng ký
    static async register(
        email: string,
        password: string,
        fullName: string,
        role: 'admin' | 'normal_user' = 'normal_user'
    ) {
        // 1. Gọi Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role // 👈 QUAN TRỌNG: Phải thêm dòng này thì nó mới lưu vào metadata
                }
            }
        });

        if (authError) throw new Error(authError.message);
        if (!authData.user) throw new Error("Đăng ký thất bại, không có User ID");

        // 2. Gọi Prisma (Lưu role vào DB)
        const newProfile = await prisma.profiles.upsert({
            where: {
                id: authData.user.id
            },
            update: {
                email: email,
                full_name: fullName,
                app_role: role, // Prisma tự hiểu string này khớp với Enum trong DB
                updated_at: new Date()
            },
            create: {
                id: authData.user.id,
                email: email,
                full_name: fullName,
                app_role: role, // Prisma tự hiểu string này khớp với Enum trong DB
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