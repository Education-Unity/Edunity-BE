import prisma from '../config/prisma';

// Interface cho dữ liệu đầu vào
interface CreateInstituteParams {
  name: string;
  slug: string;
  description?: string;
  proofDocuments: string[];
  submitNote?: string;
}

interface UpdateInstituteParams {
  description?: string;
  logoUrl?: string;
  website?: string;
}

export class InstituteService {

  // =================================================================
  // PHẦN 1: QUẢN LÝ ĐĂNG KÝ & XÁC THỰC (Register & Verify Flow)
  // =================================================================

  // [USER] 1. Tạo trung tâm mới + Gửi yêu cầu xác thực luôn
  static async registerInstitute(userId: string, data: CreateInstituteParams) {
    
    // Check Slug tồn tại
    const existingSlug = await prisma.institutes.findUnique({ where: { slug: data.slug } });
    if (existingSlug) throw new Error("Đường dẫn (Slug) này đã tồn tại.");

    // Transaction: Tạo Institute -> Tạo Verification -> Add Owner
    return await prisma.$transaction(async (tx) => {
      // 1. Tạo trung tâm (Unverified)
      const newInstitute = await tx.institutes.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          owner_id: userId,
          is_verified: false,
        }
      });

      // 2. Tạo yêu cầu xác thực
      const verification = await tx.institute_verifications.create({
        data: {
          institute_id: newInstitute.id,
          status: 'pending',
          proof_documents: data.proofDocuments, // Prisma tự convert mảng sang Json
          submit_note: data.submitNote,
          created_at: new Date()
        }
      });

      // 3. Set User làm Owner
      await tx.institute_members.create({
        data: {
          institute_id: newInstitute.id,
          user_id: userId,
          role: 'owner',
          is_verified_by_institute: true
        }
      });

      return { institute: newInstitute, verification };
    });
  }

  // [USER/OWNER] 2. Gửi lại yêu cầu xác thực (Re-submit) khi bị từ chối
  static async resubmitVerification(userId: string, instituteId: string, proofDocuments: string[], note?: string) {
    // Check quyền sở hữu
    const institute = await prisma.institutes.findFirst({
      where: { id: instituteId, owner_id: userId }
    });
    if (!institute) throw new Error("Trung tâm không tồn tại hoặc bạn không phải chủ sở hữu.");

    // Check xem có đơn nào đang pending không (tránh spam)
    const pendingRequest = await prisma.institute_verifications.findFirst({
      where: { institute_id: instituteId, status: 'pending' }
    });
    if (pendingRequest) throw new Error("Đang có yêu cầu chờ duyệt, vui lòng đợi Admin.");

    // Tạo đơn mới
    return await prisma.institute_verifications.create({
      data: {
        institute_id: instituteId,
        status: 'pending',
        proof_documents: proofDocuments,
        submit_note: note,
        created_at: new Date()
      }
    });
  }

  // [ADMIN] 3. Duyệt hoặc Từ chối yêu cầu
  static async verifyRequest(requestId: string, adminId: string, status: 'approved' | 'rejected', feedback?: string) {
    const request = await prisma.institute_verifications.findUnique({
      where: { id: requestId }
    });
    if (!request || request.status !== 'pending') throw new Error("Yêu cầu không hợp lệ hoặc đã được xử lý.");

    return await prisma.$transaction(async (tx) => {
      // 1. Update trạng thái đơn
      const updatedReq = await tx.institute_verifications.update({
        where: { id: requestId },
        data: {
          status: status,
          admin_feedback: feedback,
          verified_by: adminId,
          updated_at: new Date()
        }
      });

      // 2. Nếu Approved -> Update Institute thành Verified
      if (status === 'approved' && request.institute_id) {
        await tx.institutes.update({
          where: { id: request.institute_id },
          data: { is_verified: true }
        });
      }

      return updatedReq;
    });
  }

  // [ADMIN] 4. Lấy danh sách đơn chờ duyệt
  static async getPendingRequests() {
    return await prisma.institute_verifications.findMany({
      where: { status: 'pending' },
      include: {
        institutes: { select: { id: true, name: true, slug: true } },
        profiles: { select: { email: true, full_name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  // =================================================================
  // PHẦN 2: QUẢN LÝ THÔNG TIN & HIỂN THỊ (Support Features)
  // =================================================================

  // [USER/OWNER] 5. Xem danh sách trung tâm của tôi (kèm trạng thái)
  static async getMyInstitutes(userId: string) {
    return await prisma.institutes.findMany({
      where: { owner_id: userId },
      include: {
        institute_verifications: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });
  }

  // [USER/OWNER] 6. Cập nhật thông tin trung tâm (Logo, Bio...)
  static async updateInstituteInfo(userId: string, instituteId: string, data: UpdateInstituteParams) {
    const institute = await prisma.institutes.findFirst({
      where: { id: instituteId, owner_id: userId }
    });
    if (!institute) throw new Error("Không có quyền chỉnh sửa.");

    return await prisma.institutes.update({
      where: { id: instituteId },
      data: {
        description: data.description,
        logo_url: data.logoUrl,
        website: data.website
      }
    });
  }

  // [PUBLIC] 7. Lấy danh sách trung tâm đã xác thực (Cho trang chủ)
  static async getPublicVerifiedInstitutes(page: number = 1, search?: string) {
    const limit = 10;
    const skip = (page - 1) * limit;
    
    return await prisma.institutes.findMany({
      where: {
        is_verified: true,
        name: search ? { contains: search, mode: 'insensitive' } : undefined
      },
      select: {
        id: true, name: true, slug: true, logo_url: true, description: true
      },
      take: limit,
      skip: skip,
      orderBy: { created_at: 'desc' }
    });
  }

  // 👇 [MỚI] 8. Lấy chi tiết công khai của 1 trung tâm (Cho trang Detail)
  static async getInstitutePublicDetail(slugOrId: string) {
    // Regex check xem input là UUID hay Slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    const institute = await prisma.institutes.findFirst({
      where: {
        AND: [
          { is_verified: true }, // Chỉ lấy cái đã duyệt
          isUuid ? { id: slugOrId } : { slug: slugOrId }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo_url: true,
        website: true,
        created_at: true,
        _count: {
            select: { 
                classrooms: true, // Đếm số lớp học
                institute_members: true // Đếm số thành viên
            }
        }
      }
    });

    if (!institute) throw new Error("Trung tâm không tồn tại hoặc chưa được xác thực.");
    return institute;
  }
}