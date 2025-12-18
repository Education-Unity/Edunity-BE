import prisma from '../config/prisma';

export class VerificationService {
  
  // 1. User gửi yêu cầu xác thực mới
  static async createRequest(userId: string, proofUrl: string, type: string) {
    
    // Kiểm tra xem user này có đơn nào đang "pending" không? Tránh spam.
    const pendingRequest = await prisma.teacher_verifications.findFirst({
      where: {
        user_id: userId,
        status: 'pending'
      }
    });

    if (pendingRequest) {
      throw new Error("Bạn đang có một yêu cầu chờ duyệt. Vui lòng đợi Admin xử lý.");
    }

    // Kiểm tra xem user này đã được duyệt trước đó chưa (đã có giấy phép chưa)
    const approvedRequest = await prisma.teacher_verifications.findFirst({
      where: {
        user_id: userId,
        status: 'approved'
      }
    });

    if (approvedRequest) {
      throw new Error("Bạn đã được xác thực là Giáo viên rồi.");
    }

    // Tạo yêu cầu mới
    const newRequest = await prisma.teacher_verifications.create({
      data: {
        user_id: userId,
        proof_url: proofUrl,
        verification_type: type, // Ví dụ: "degree", "certificate"
        status: 'pending',       // Mặc định là chờ duyệt
        created_at: new Date()
      }
    });

    return newRequest;
  }

  // 2. Admin lấy danh sách các đơn đang chờ (Pending)
  static async getPendingRequests() {
    return await prisma.teacher_verifications.findMany({
      where: {
        status: 'pending' 
      },
      include: {
        // Join sang bảng profiles để lấy tên và email người gửi
        profiles_user: {
          select: {
            id: true,
            email: true,
            full_name: true,
            avatar_url: true
          }
        }
      },
      orderBy: {
        created_at: 'desc' // Đơn mới nhất lên đầu
      }
    });
  }

  // 3. Admin duyệt hoặc từ chối đơn
  static async verifyRequest(requestId: string, adminId: string, status: 'approved' | 'rejected', reason?: string) {
    
    // Tìm đơn theo ID
    const request = await prisma.teacher_verifications.findUnique({
      where: { id: requestId }
    });

    if (!request) throw new Error("Không tìm thấy yêu cầu xác thực.");
    
    if (request.status !== 'pending') {
      throw new Error("Yêu cầu này đã được xử lý trước đó.");
    }

    // Cập nhật trạng thái (Chỉ update bảng verification, KHÔNG đụng bảng profiles)
    const updatedRequest = await prisma.teacher_verifications.update({
      where: { id: requestId },
      data: {
        status: status,       // 'approved' hoặc 'rejected'
        reason: reason,       // Lưu lý do nếu từ chối
        verified_by: adminId, // Lưu ID của Admin đã duyệt
        verified_at: new Date()
      }
    });

    return updatedRequest;
  }
}