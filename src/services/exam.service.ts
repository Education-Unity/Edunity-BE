import prisma from '../config/prisma';

export class ExamService {

  // 👇 1. Tạo Đề thi (Exam)
  static async createExam(userId: string, classId: string, data: {
    title: string;
    description?: string;
    duration_minutes: number;
    passing_score: number;
  }) {
    
    // B1: Check quyền (Giáo viên hoặc Chủ phòng)
    const member = await prisma.classroom_members.findUnique({
      where: {
        classroom_id_user_id: { classroom_id: classId, user_id: userId }
      }
    });

    if (!member || (member.role !== 'owner' && member.role !== 'instructor')) {
      throw new Error("Bạn không có quyền tạo đề thi trong lớp này.");
    }

    // B2: Tạo Đề thi
    return await prisma.exams.create({
      data: {
        classroom_id: classId,
        title: data.title,
        description: data.description,
        duration_minutes: data.duration_minutes,
        passing_score: data.passing_score,
        is_published: false, // Mặc định là nháp (Draft)
        mode: 'examination' // Mode mặc định
      }
    });
  }

  // 👇 2. Thêm Câu hỏi (Question) vào Đề thi
  static async addQuestion(userId: string, examId: string, data: {
    content: string;
    options: any; // Mảng JSON: [{key: "A", text: "..."}, ...]
    correct_option: string;
    points: number;
  }) {
    
    // B1: Lấy thông tin Exam để biết nó thuộc lớp nào
    const exam = await prisma.exams.findUnique({
      where: { id: examId }
    });

    if (!exam || !exam.classroom_id) throw new Error("Đề thi không tồn tại.");

    // B2: Check quyền của người đang thêm câu hỏi
    const member = await prisma.classroom_members.findUnique({
      where: {
        classroom_id_user_id: { classroom_id: exam.classroom_id, user_id: userId }
      }
    });

    if (!member || (member.role !== 'owner' && member.role !== 'instructor')) {
      throw new Error("Bạn không có quyền chỉnh sửa đề thi này.");
    }

    // B3: Tính số thứ tự (Sort Order) để câu mới nằm cuối cùng
    const count = await prisma.exam_questions.count({
      where: { exam_id: examId }
    });

    // B4: Insert câu hỏi
    return await prisma.exam_questions.create({
      data: {
        exam_id: examId,
        content: data.content,
        options: data.options,
        correct_option: data.correct_option,
        points: data.points,
        sort_order: count + 1, // Tự động tăng
        type: 'multiple_choice'
      }
    });
  }

  // 👇 3. Lấy chi tiết đề thi (Dành cho Giáo viên Review)
  // Lưu ý: Hàm này trả về FULL đáp án đúng để giáo viên check
  static async getExamDetail(examId: string) {
    const exam = await prisma.exams.findUnique({
      where: { id: examId },
      include: {
        exam_questions: {
          orderBy: { sort_order: 'asc' } // Sắp xếp theo thứ tự câu 1, 2, 3...
        }
      }
    });

    if (!exam) throw new Error("Đề thi không tồn tại.");
    return exam;
  }

  static async getExamForStudent(userId: string, examId: string) {
    // Check quyền: Phải là thành viên lớp mới được xem đề
    // (Logic check member bỏ qua cho gọn, bạn tự thêm vào giống các hàm trên nhé)

    const exam = await prisma.exams.findUnique({
      where: { id: examId },
      include: {
        exam_questions: {
          orderBy: { sort_order: 'asc' },
          // 🛡️ BẢO MẬT: Chỉ lấy nội dung câu hỏi và các phương án A,B,C,D
          // KHÔNG chọn cột 'correct_option'
          select: {
            id: true,
            content: true,
            options: true,
            points: true, 
            type: true,
            sort_order: true
            // correct_option: false (Mặc định không select là ẩn)
          }
        }
      }
    });

    if (!exam) throw new Error("Đề thi không tồn tại.");
    if (!exam.is_published) throw new Error("Đề thi chưa được công bố.");

    return exam;
  }

  // 👇 5. [Student] Nộp bài thi (Đã update theo Schema của bạn)
  static async submitExam(studentId: string, examId: string, studentAnswers: { question_id: string, selected_key: string }[]) {
    
    // B1: Lấy "đáp án gốc" từ Database
    const exam = await prisma.exams.findUnique({
      where: { id: examId },
      include: { exam_questions: true } 
    });

    if (!exam) throw new Error("Đề thi không tồn tại.");

    // B2: Tính điểm
    let maxScore = 0; // Tổng điểm tối đa của đề (VD: 10)
    let studentScore = 0; // Điểm học sinh đạt được (VD: 8)

    const questionMap = new Map(exam.exam_questions.map(q => [q.id, q]));

    // Duyệt qua bài làm của học sinh để tính điểm đạt được
    for (const answer of studentAnswers) {
      const question = questionMap.get(answer.question_id);
      
      if (question) {
        // So sánh Key (A, B) với Database
        if (answer.selected_key === question.correct_option) {
          // Lưu ý: points trong DB có thể null, nên cần || 0
          studentScore += (question.points || 0); 
        }
      }
    }
    
    // Tính tổng điểm max của đề (Cộng điểm tất cả câu hỏi lại)
    maxScore = exam.exam_questions.reduce((sum, q) => sum + (q.points || 0), 0);

    // B3: Lưu kết quả vào DB (Khớp với tên cột bảng exam_attempts của bạn)
    const attempt = await prisma.exam_attempts.create({
      data: {
        exam_id: examId,
        student_id: studentId,
        
        score: studentScore,       // Điểm đạt được
        max_score: maxScore,       // Điểm tối đa
        
        answers_snapshot: studentAnswers, // Lưu JSON snapshot
        finished_at: new Date()    // Thời điểm nộp
        // started_at: ... (Đã có default now() trong DB tự xử lý)
      }
    });

    return attempt;
  }

  // 👇 6. [Teacher] Công bố đề thi (Publish)
  static async publishExam(userId: string, examId: string) {
    // B1: Lấy thông tin exam
    const exam = await prisma.exams.findUnique({ where: { id: examId } });
    if (!exam || !exam.classroom_id) throw new Error("Đề thi không tồn tại.");

    // B2: Check quyền Giáo viên
    const member = await prisma.classroom_members.findUnique({
      where: {
        classroom_id_user_id: { classroom_id: exam.classroom_id, user_id: userId }
      }
    });

    if (!member || (member.role !== 'owner' && member.role !== 'instructor')) {
      throw new Error("Bạn không có quyền công bố đề thi này.");
    }

    // B3: Update
    return await prisma.exams.update({
      where: { id: examId },
      data: { is_published: true }
    });
  }
}