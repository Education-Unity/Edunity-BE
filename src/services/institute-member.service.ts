import prisma from '../config/prisma';
import { institute_role } from '@prisma/client';

export class InstituteMemberService {

  // 🔥 Helper: Check quyền 2 lớp (Fix lỗi Owner không thêm được member)
  private static async validateAdminOrOwner(userId: string, instituteId: string) {
    // Lớp 1: Check Owner gốc trong bảng institutes
    const institute = await prisma.institutes.findUnique({ where: { id: instituteId } });
    if (!institute) throw new Error("Trung tâm không tồn tại.");
    if (institute.owner_id === userId) return true; // Pass ngay

    // Lớp 2: Check Admin trong bảng members
    const member = await prisma.institute_members.findUnique({
      where: { institute_id_user_id: { institute_id: instituteId, user_id: userId } }
    });
    if (member && (member.role === 'owner' || member.role === 'admin')) return true;

    throw new Error("Bạn không có quyền quản lý thành viên.");
  }

  // 1. Thêm thành viên
  static async addMember(requesterId: string, instituteId: string, email: string, role: institute_role, studentIdCode?: string) {
    await this.validateAdminOrOwner(requesterId, instituteId); // Dùng hàm mới

    const userToAdd = await prisma.profiles.findFirst({ where: { email } });
    if (!userToAdd) throw new Error("Email này chưa đăng ký tài khoản hệ thống.");

    const existingMember = await prisma.institute_members.findUnique({
      where: { institute_id_user_id: { institute_id: instituteId, user_id: userToAdd.id } }
    });
    if (existingMember) throw new Error("Thành viên này đã tồn tại.");

    return await prisma.institute_members.create({
      data: {
        institute_id: instituteId,
        user_id: userToAdd.id,
        role: role,
        student_id_code: studentIdCode,
        is_verified_by_institute: true,
        joined_at: new Date()
      }
    });
  }

  // 2. Lấy danh sách
  static async getMembers(instituteId: string) {
    return await prisma.institute_members.findMany({
      where: { institute_id: instituteId },
      include: { profiles: { select: { id: true, full_name: true, email: true, avatar_url: true } } },
      orderBy: { joined_at: 'desc' }
    });
  }

  // 3. Xóa thành viên
  static async removeMember(requesterId: string, instituteId: string, memberIdToRemove: string) {
    await this.validateAdminOrOwner(requesterId, instituteId); // Dùng hàm mới

    const targetMember = await prisma.institute_members.findUnique({
      where: { institute_id_user_id: { institute_id: instituteId, user_id: memberIdToRemove } }
    });
    
    if (!targetMember) throw new Error("Thành viên không tồn tại.");
    if (targetMember.role === 'owner') throw new Error("Không thể xóa Owner.");

    return await prisma.institute_members.delete({
      where: { institute_id_user_id: { institute_id: instituteId, user_id: memberIdToRemove } }
    });
  }

  // 4. Cập nhật thành viên
  static async updateMember(requesterId: string, instituteId: string, targetUserId: string, data: any) {
    await this.validateAdminOrOwner(requesterId, instituteId); // Dùng hàm mới

    const targetMember = await prisma.institute_members.findUnique({
        where: { institute_id_user_id: { institute_id: instituteId, user_id: targetUserId } }
    });
    if (!targetMember) throw new Error("Thành viên không tồn tại.");

    return await prisma.institute_members.update({
        where: { institute_id_user_id: { institute_id: instituteId, user_id: targetUserId } },
        data
    });
  }
}