import prisma from '../config/prisma';

export class AssignmentService {

  // 👇 1. Giáo viên tạo bài tập mới
  static async createAssignment(userId: string, classId: string, data: {
    title: string;
    description?: string;
    due_date?: Date;
    max_score?: number;
  }) {
    // B1: Check quyền (Giống bên Lesson)
    const member = await prisma.classroom_members.findUnique({
      where: {
        classroom_id_user_id: { classroom_id: classId, user_id: userId }
      }
    });

    if (!member || (member.role !== 'owner' && member.role !== 'instructor')) {
      throw new Error("Bạn không có quyền giao bài tập trong lớp này.");
    }

    // B2: Tạo Assignment
    return await prisma.assignments.create({
      data: {
        classroom_id: classId,
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        max_score: data.max_score || 100, // Mặc định thang điểm 100
        created_at: new Date()
      }
    });
  }

  // 👇 2. Lấy danh sách bài tập trong lớp
  static async getAssignmentsByClass(classId: string) {
    return await prisma.assignments.findMany({
      where: { classroom_id: classId },
      orderBy: { created_at: 'desc' }, // Bài mới nhất lên đầu
      include: {
        _count: {
          select: { assignment_submissions: true } // Đếm xem bao nhiêu người nộp rồi
        }
      }
    });
  }

  // 👇 3. Học sinh nộp bài (Submit)
  static async submitAssignment(studentId: string, assignmentId: string, data: {
    content?: string;
    file_urls?: any; // JSON
  }) {
    // B1: Check bài tập có tồn tại không
    const assignment = await prisma.assignments.findUnique({
      where: { id: assignmentId }
    });
    if (!assignment) throw new Error("Bài tập không tồn tại.");

    // B2: Check hạn nộp (Optional - nếu muốn chặn nộp muộn thì mở ra)
    // if (assignment.due_date && new Date() > assignment.due_date) {
    //    throw new Error("Đã quá hạn nộp bài!");
    // }

    // B3: Tạo bản nộp bài (Submission)
    // Logic: Mỗi lần nộp là tạo mới (để lưu lịch sử), nhưng ở đây mình làm đơn giản là Update nếu nộp lại
    // Hoặc Create mới. Ở đây mình dùng Create mới cho đúng chuẩn "Nộp nhiều lần".
    
    // Tìm lần nộp cuối cùng để tính attempt_number
    const lastSubmission = await prisma.assignment_submissions.findFirst({
        where: { assignment_id: assignmentId, student_id: studentId },
        orderBy: { attempt_number: 'desc' }
    });

    const nextAttempt = (lastSubmission?.attempt_number || 0) + 1;

    // Set các bài cũ thành is_latest = false
    if (lastSubmission) {
        await prisma.assignment_submissions.updateMany({
            where: { assignment_id: assignmentId, student_id: studentId },
            data: { is_latest: false }
        });
    }

    const submission = await prisma.assignment_submissions.create({
      data: {
        assignment_id: assignmentId,
        student_id: studentId,
        content: data.content,
        file_urls: data.file_urls,
        attempt_number: nextAttempt,
        is_latest: true,
        status: 'submitted',
        submitted_at: new Date()
      }
    });

    return submission;
  }

  static async getSubmissionsForAssignment(userId: string, assignmentId: string) {
    
    // B1: Lấy thông tin bài tập để biết nó thuộc lớp nào
    const assignment = await prisma.assignments.findUnique({
      where: { id: assignmentId }
    });
    if (!assignment) throw new Error("Bài tập không tồn tại.");

    // B2: Check quyền (Chỉ Giáo viên mới được xem hết)
    const member = await prisma.classroom_members.findUnique({
      where: {
        classroom_id_user_id: {
          classroom_id: assignment.classroom_id!, // Dấu ! để báo TS là chắc chắn có
          user_id: userId
        }
      }
    });

    if (!member || (member.role !== 'owner' && member.role !== 'instructor')) {
      throw new Error("Bạn không có quyền xem danh sách bài nộp.");
    }

    // B3: Lấy danh sách (Chỉ lấy bài nộp mới nhất của mỗi học sinh - is_latest=true)
    return await prisma.assignment_submissions.findMany({
      where: {
        assignment_id: assignmentId,
        is_latest: true // Chỉ lấy bản nộp cuối cùng
      },
      include: {
        profiles: { // Lấy tên học sinh
          select: { id: true, full_name: true, avatar_url: true, email: true }
        }
      },
      orderBy: { submitted_at: 'desc' }
    });
  }

  // 👇 5. [Teacher] Chấm điểm một bài nộp
  static async gradeSubmission(userId: string, submissionId: string, data: {
    grade: number;
    feedback?: string;
  }) {
    
    // B1: Tìm bài nộp -> Lần ngược ra Assignment -> Lần ra Classroom
    const submission = await prisma.assignment_submissions.findUnique({
      where: { id: submissionId },
      include: {
        assignments: true // Join bảng assignments để lấy classroom_id
      }
    });

    if (!submission || !submission.assignments) {
      throw new Error("Bài nộp không tồn tại.");
    }

    const classId = submission.assignments.classroom_id!;

    // B2: Check quyền Giáo viên
    const member = await prisma.classroom_members.findUnique({
      where: {
        classroom_id_user_id: { classroom_id: classId, user_id: userId }
      }
    });

    if (!member || (member.role !== 'owner' && member.role !== 'instructor')) {
      throw new Error("Bạn không có quyền chấm điểm bài này.");
    }

    // B3: Update điểm số
    return await prisma.assignment_submissions.update({
      where: { id: submissionId },
      data: {
        grade: data.grade,
        feedback: data.feedback,
        status: 'graded' // Đổi trạng thái thành Đã chấm
      }
    });
  }
}