import prisma from '../config/prisma';
import * as profileRepo from '../repositories/profile.repository';

export class ProfileService {
  // Lấy thông tin profile theo ID
  static async getProfile(userId: string) {
    const profile = await prisma.profiles.findUnique({
      where: { id: userId },
      include: {
        // Sau này khi có bảng institutes hay classrooms thì include vào đây
        // institutes: true 
      }
    });
    
    if (!profile) throw new Error("Profile not found");
    return profile;
  }

  // Cập nhật thông tin profile
  static async updateProfile(userId: string, data: any) {
    // Chỉ cho phép update các trường cho phép
    return await prisma.profiles.update({
      where: { id: userId },
      data: {
        full_name: data.full_name,
        bio: data.bio,
        phone: data.phone,
        avatar_url: data.avatar_url, // Sau này sẽ nhận link từ Cloudinary
        updated_at: new Date()
      }
    });
  }

  
}