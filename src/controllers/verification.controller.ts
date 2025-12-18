import { Request, Response } from 'express';
import { VerificationService } from '../services/verification.service';
import { z } from 'zod';

export class VerificationController {

  // [POST] User gửi yêu cầu
  static async submitRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id; // Lấy ID user từ token

      // Validate dữ liệu gửi lên
      const schema = z.object({
        proof_url: z.string().url({ message: "Link bằng cấp phải là URL hợp lệ" }),
        verification_type: z.string().min(2, { message: "Loại bằng cấp không được để trống" })
      });
      
      const body = schema.parse(req.body);

      const request = await VerificationService.createRequest(
        userId, 
        body.proof_url, 
        body.verification_type
      );

      res.status(201).json({
        message: "Gửi yêu cầu thành công! Vui lòng chờ Admin duyệt.",
        data: request
      });

    } catch (error: any) {
      const errorMessage = error.errors ? error.errors[0].message : error.message;
      res.status(400).json({ error: errorMessage });
    }
  }

  // [GET] Admin xem danh sách chờ
  static async listPendingRequests(req: Request, res: Response) {
    try {
      const requests = await VerificationService.getPendingRequests();
      res.status(200).json({ data: requests });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // [PUT] Admin xử lý đơn (Duyệt/Từ chối)
  static async processRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const adminId = (req as any).user.id;

      // 1. Định nghĩa Schema Validation
      const schema = z.object({
        status: z.enum(['approved', 'rejected']),
        reason: z.string().optional()
      });
      
      // 2. Parse body
      const rawBody = schema.parse(req.body);

      // 🔥 FIX LỖI Ở ĐÂY: Ép kiểu rõ ràng để khớp với tham số của Service
      // TypeScript sẽ hiểu body.status chính xác là 'approved' hoặc 'rejected'
      const body = rawBody as { 
        status: 'approved' | 'rejected'; 
        reason?: string 
      };

      const result = await VerificationService.verifyRequest(
        id, 
        adminId, 
        body.status, // Giờ nó đã hết báo lỗi
        body.reason
      );

      res.status(200).json({
        message: body.status === 'approved' ? "Đã duyệt yêu cầu thành công." : "Đã từ chối yêu cầu.",
        data: result
      });

    } catch (error: any) {
      // Xử lý lỗi Zod cho đẹp
      if (error instanceof z.ZodError) {
         return res.status(400).json({ error: error.issues[0].message });
      }
      res.status(400).json({ error: error.message });
    }
  }
}