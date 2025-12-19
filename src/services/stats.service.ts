import prisma from '../config/prisma';

export class StatsService {

  // 👇 1. Thống kê tổng quan lớp học (Dành cho Giáo viên)
  static async getClassOverview(userId: string, classId: string) {
    // Check quyền (Giáo viên mới được xem thống kê chi tiết)
    // (Logic check role member mình lược bớt cho ngắn, bạn tự thêm vào nhé)

    // A. Đếm số lượng
    const [totalStudents, totalLessons, totalExams] = await Promise.all([
      // Đếm học sinh (trừ owner/instructor)
      prisma.classroom_members.count({
        where: { classroom_id: classId, role: 'student' }
      }),
      // Đếm bài học
      prisma.lessons.count({ where: { classroom_id: classId } }),
      // Đếm đề thi đã publish
      prisma.exams.count({ where: { classroom_id: classId, is_published: true } })
    ]);

    // B. Tính điểm trung bình của cả lớp trong các kỳ thi
    // Lấy tất cả bài làm của lớp này
    const attempts = await prisma.exam_attempts.aggregate({
      where: {
        exams: { classroom_id: classId } // Relation filter
      },
      _avg: {
        score: true // Tính trung bình cột score
      },
      _count: {
        id: true // Đếm tổng số lượt làm bài
      }
    });

    return {
      overview: {
        students: totalStudents,
        lessons: totalLessons,
        exams: totalExams,
        total_exam_attempts: attempts._count.id,
        average_exam_score: Math.round((attempts._avg.score || 0) * 100) / 100 // Làm tròn 2 số lẻ
      }
    };
  }

  // 👇 2. Bảng xếp hạng học sinh (Leaderboard) - Dựa trên tổng điểm thi
  static async getLeaderboard(classId: string) {
    // Logic: Cộng tổng điểm (score) của tất cả các bài thi (exam_attempts) theo từng student_id
    
    // Bước 1: Group by student_id và tính tổng điểm
    const groupByStudent = await prisma.exam_attempts.groupBy({
      by: ['student_id'],
      where: {
        exams: { classroom_id: classId } // Chỉ tính điểm của lớp này
      },
      _sum: {
        score: true
      },
      orderBy: {
        _sum: {
          score: 'desc' // Điểm cao nhất lên đầu
        }
      },
      take: 10 // Chỉ lấy Top 10
    });

    // Bước 2: Vì groupBy không trả về thông tin user (tên, avatar),
    // Ta phải query lại bảng profiles để lấy thông tin dựa trên list student_id vừa tìm được.
    
    const studentIds = groupByStudent.map(item => item.student_id).filter(id => id !== null) as string[];

    const profiles = await prisma.profiles.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, full_name: true, avatar_url: true }
    });

    // Bước 3: Ghép dữ liệu lại (Merge score + profile)
    const leaderboard = groupByStudent.map((item, index) => {
      const profile = profiles.find(p => p.id === item.student_id);
      return {
        rank: index + 1,
        student_id: item.student_id,
        full_name: profile?.full_name || "Unknown",
        avatar_url: profile?.avatar_url,
        total_score: item._sum.score || 0
      };
    });

    return leaderboard;
  }
}