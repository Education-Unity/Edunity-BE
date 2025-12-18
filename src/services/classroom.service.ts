import prisma from '../config/prisma';
import { enrollment_type, classroom_role } from '@prisma/client'; // Import Enum để tránh lỗi Type

export class ClassroomService {

  static async createClassroom(ownerId: string, data: {
    title: string;
    description?: string;
    enrollment_type?: enrollment_type;
    access_code?: string;
    price?: number;
  }) {
    
    // 1. KIỂM TRA GIẤY PHÉP (Freelancer Mode)
    // Tìm xem user này có đơn xác thực nào đã được APPROVED chưa
    const license = await prisma.teacher_verifications.findFirst({
      where: {
        user_id: ownerId,
        status: 'approved'
      }
    });

    if (!license) {
      throw new Error("Bạn chưa được cấp quyền Giáo viên. Vui lòng xác thực hồ sơ trước.");
    }

    // 2. TẠO LỚP HỌC (Dùng Transaction)
    return await prisma.$transaction(async (tx) => {
      
      // B1: Tạo cái vỏ lớp học
      const newClassroom = await tx.classrooms.create({
        data: {
          owner_id: ownerId,
          title: data.title,
          description: data.description,
          enrollment_type: data.enrollment_type || 'public', // Mặc định là công khai
          access_code: data.access_code,
          price: data.price,
          institute_id: null // 👈 Quan trọng: Freelancer nên không thuộc trường nào
        }
      });

      // B2: Add chính ông tạo lớp vào làm thành viên với role OWNER
      await tx.classroom_members.create({
        data: {
          classroom_id: newClassroom.id,
          user_id: ownerId,
          role: 'owner' // 👈 Role to nhất trong lớp
        }
      });

      return newClassroom;
    });
  }
  static async findAll(filters: { 
    page: number; 
    limit: number; 
    keyword?: string; 
    ownerId?: string 
  }) {
    const { page, limit, keyword, ownerId } = filters;
    const skip = (page - 1) * limit;

    // Xây dựng điều kiện lọc
    const whereCondition: any = {
      is_archived: false // Chỉ lấy lớp chưa bị ẩn
    };

    if (keyword) {
      whereCondition.title = { contains: keyword, mode: 'insensitive' }; // Tìm không phân biệt hoa thường
    }

    if (ownerId) {
      whereCondition.owner_id = ownerId; // Chỉ lấy lớp của ông này tạo
    }

    // Query DB
    const [total, classrooms] = await Promise.all([
      prisma.classrooms.count({ where: whereCondition }),
      prisma.classrooms.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' }, // Lớp mới nhất lên đầu
        include: {
          // Lấy thông tin cơ bản của giáo viên
          profiles: {
            select: { full_name: true, avatar_url: true }
          },
          // Đếm số lượng thành viên
          _count: {
            select: { classroom_members: true }
          }
        }
      })
    ]);

    return {
      data: classrooms,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  // 👇 2. Lấy chi tiết một lớp
  static async findOne(id: string) {
    const classroom = await prisma.classrooms.findUnique({
      where: { id },
      include: {
        profiles: { // Info giáo viên
          select: { id: true, full_name: true, avatar_url: true, bio: true }
        },
        _count: { // Đếm học sinh
          select: { classroom_members: true, lessons: true }
        }
      }
    });

    if (!classroom) throw new Error("Lớp học không tồn tại");
    return classroom;
  }

  static async joinClassroom(userId: string, classId: string, accessCode?: string) {
    
    // B1: Tìm lớp học
    const classroom = await prisma.classrooms.findUnique({
      where: { id: classId }
    });

    if (!classroom) throw new Error("Lớp học không tồn tại.");

    // B2: Check xem có phải chủ lớp không? (Chủ lớp không cần tham gia lại)
    if (classroom.owner_id === userId) {
      throw new Error("Bạn là giáo viên chủ nhiệm của lớp này rồi!");
    }

    // B3: Check xem đã tham gia chưa?
    const existingMember = await prisma.classroom_members.findUnique({
      where: {
        classroom_id_user_id: { // Prisma tự tạo unique key này từ 2 cột
          classroom_id: classId,
          user_id: userId
        }
      }
    });

    if (existingMember) {
      throw new Error("Bạn đã là thành viên của lớp này rồi.");
    }

    // B4: Xử lý theo loại hình lớp học (Enrollment Type)
    switch (classroom.enrollment_type) {
      
      case 'public':
        // Vào thoải mái, không cần làm gì thêm
        break;

      case 'password':
        // Phải check mã code
        if (!accessCode) throw new Error("Lớp này yêu cầu mã truy cập.");
        if (accessCode !== classroom.access_code) throw new Error("Mã truy cập không đúng.");
        break;

      case 'request':
        throw new Error("Lớp này cần gửi yêu cầu phê duyệt (Tính năng đang phát triển).");
      
      case 'paid':
        throw new Error("Lớp này cần thanh toán trước khi vào.");
        
      default:
        throw new Error("Loại lớp học không hợp lệ.");
    }

    // B5: Thêm vào lớp (Role mặc định là STUDENT)
    const newMember = await prisma.classroom_members.create({
      data: {
        classroom_id: classId,
        user_id: userId,
        role: 'student' // Mặc định vào là học sinh
      }
    });

    return newMember;
  }

  static async getMembers(classId: string) {
    // Check xem lớp có tồn tại không
    const classroom = await prisma.classrooms.findUnique({
      where: { id: classId }
    });

    if (!classroom) throw new Error("Lớp học không tồn tại.");

    // Lấy list members
    const members = await prisma.classroom_members.findMany({
      where: { classroom_id: classId },
      include: {
        // Join sang bảng profiles để lấy tên, avatar
        profiles: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
            email: true,
            app_role: true // Để biết nó là normal_user hay gì (optional)
          }
        }
      },
      orderBy: {
        joined_at: 'asc' // Người vào sớm nhất (Owner) lên đầu
      }
    });

    return members;
  }

  
}