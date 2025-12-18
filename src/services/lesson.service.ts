import prisma from '../config/prisma';

export class LessonService {

  // 👇 1. Tạo bài giảng mới
  static async createLesson(userId: string, classId: string, data: {
    title: string;
    content?: string;
    video_url?: string;
  }) {
    
    // B1: Check quyền (Quan trọng!)
    // Phải xem user này có phải là Owner hoặc Instructor trong lớp đó không
    const member = await prisma.classroom_members.findUnique({
      where: {
        classroom_id_user_id: {
          classroom_id: classId,
          user_id: userId
        }
      }
    });

    if (!member || (member.role !== 'owner' && member.role !== 'instructor')) {
      throw new Error("Bạn không có quyền tạo bài giảng trong lớp này.");
    }

    // B2: Tính thứ tự (Sort Order)
    // Đếm xem trong lớp đang có bao nhiêu bài, bài mới sẽ nằm cuối
    const lessonCount = await prisma.lessons.count({
      where: { classroom_id: classId }
    });

    // B3: Tạo bài học
    const newLesson = await prisma.lessons.create({
      data: {
        classroom_id: classId,
        title: data.title,
        content: data.content,
        video_url: data.video_url,
        sort_order: lessonCount + 1, // Tự động tăng số thứ tự
        is_published: true // Mặc định publish luôn cho nhanh (sau này làm tính năng nháp sau)
      }
    });

    return newLesson;
  }

  // 👇 2. Lấy danh sách bài giảng của lớp
  static async getLessonsByClass(classId: string) {
    // Check xem lớp có tồn tại không (Optional)
    const classroom = await prisma.classrooms.findUnique({ where: { id: classId } });
    if (!classroom) throw new Error("Lớp học không tồn tại");

    return await prisma.lessons.findMany({
      where: { classroom_id: classId },
      orderBy: { sort_order: 'asc' } // Sắp xếp từ bài 1 -> bài n
    });
  }
}