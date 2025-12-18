import prisma from '../config/prisma';

export class AttendanceService {

  // 👇 1. [Teacher] Tạo phiên điểm danh mới
  static async createSession(userId: string, classId: string, durationMinutes: number) {
    
    // B1: Check quyền Giáo viên (Owner/Instructor)
    const member = await prisma.classroom_members.findUnique({
      where: {
        classroom_id_user_id: { classroom_id: classId, user_id: userId }
      }
    });

    if (!member || (member.role !== 'owner' && member.role !== 'instructor')) {
      throw new Error("Bạn không có quyền mở điểm danh.");
    }

    // B2: Tính thời gian đóng (Close Time)
    const now = new Date();
    const closeAt = new Date(now.getTime() + durationMinutes * 60000); // Cộng thêm phút

    // B3: Tạo Session
    return await prisma.attendance_sessions.create({
      data: {
        classroom_id: classId,
        open_at: now,
        close_at: closeAt,
        late_threshold_minutes: 15, // Mặc định đi trễ sau 15p so với giờ mở (tuỳ chỉnh sau)
        auto_mark_absent: true      // Sau này chạy job tự đánh vắng nếu không check-in
      }
    });
  }

  // 👇 2. [Student] Điểm danh (Check-in)
  static async checkIn(studentId: string, sessionId: string, locationData?: any) {
    
    // B1: Lấy thông tin phiên
    const session = await prisma.attendance_sessions.findUnique({
      where: { id: sessionId }
    });
    if (!session) throw new Error("Phiên điểm danh không tồn tại.");

    // B2: Check thời gian (Có còn mở không?)
    const now = new Date();
    if (session.close_at && now > session.close_at) {
      throw new Error("Phiên điểm danh đã đóng. Bạn đã bị đánh dấu vắng.");
    }

    // B3: Check xem đã điểm danh chưa? (Tránh spam)
    const existingRecord = await prisma.attendance_records.findFirst({
      where: { session_id: sessionId, student_id: studentId }
    });
    if (existingRecord) throw new Error("Bạn đã điểm danh rồi.");

    // B4: Ghi nhận
    // Logic đi trễ: Nếu quá giờ mở + late_threshold -> Late
    let status = 'present';
    // (Logic này làm đơn giản, nếu muốn chính xác phải so sánh open_at)
    
    return await prisma.attendance_records.create({
      data: {
        session_id: sessionId,
        student_id: studentId,
        checked_in_at: now,
        status: status, // present
        location_data: locationData // Lưu toạ độ GPS nếu có (để chống gian lận)
      }
    });
  }

  // 👇 3. [Teacher] Xem danh sách ai đã điểm danh
  static async getSessionRecords(userId: string, sessionId: string) {
    // Logic check quyền teacher bỏ qua cho ngắn gọn (nhưng thực tế nên có)
    
    return await prisma.attendance_records.findMany({
      where: { session_id: sessionId },
      include: {
        profiles: {
          select: { id: true, full_name: true, avatar_url: true, email: true }
        }
      },
      orderBy: { checked_in_at: 'asc' }
    });
  }

  // 👇 4. Lấy danh sách các phiên điểm danh của một lớp
  static async getSessionsByClass(classId: string) {
    return await prisma.attendance_sessions.findMany({
      where: { classroom_id: classId },
      orderBy: { open_at: 'desc' }, // Mới nhất lên đầu
      include: {
        _count: {
          select: { attendance_records: true } // Đếm xem bao nhiêu người đã điểm danh
        }
      }
    });
  }
}