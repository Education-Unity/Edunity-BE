import { Request, Response } from 'express';
import { InstituteMemberService } from '../services/institute-member.service';
import { z } from 'zod';
import { institute_role } from '@prisma/client';

export class InstituteMemberController {

  // POST: Thêm thành viên
  static async addMember(req: Request, res: Response) {
    try {
      const requesterId = (req as any).user.id;
      const { id } = req.params;

      const schema = z.object({
        email: z.string().email(),
        role: z.nativeEnum(institute_role).default(institute_role.student as any),
        student_id_code: z.string().optional()
      });

      const body = schema.parse(req.body);

      const result = await InstituteMemberService.addMember(
          requesterId, 
          id, 
          body.email, 
          body.role, 
          body.student_id_code
      );
      
      res.status(201).json({ message: "Thêm thành viên thành công!", data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // GET: Lấy danh sách
  static async listMembers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await InstituteMemberService.getMembers(id);
      res.status(200).json({ data: result });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  // DELETE: Xóa thành viên
  static async removeMember(req: Request, res: Response) {
    try {
      const requesterId = (req as any).user.id;
      const { id, userId } = req.params;

      await InstituteMemberService.removeMember(requesterId, id, userId);
      res.status(200).json({ message: "Đã xóa thành viên." });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // PATCH: Cập nhật (Role, Mã SV...)
  static async updateMember(req: Request, res: Response) {
    try {
        const requesterId = (req as any).user.id;
        const { id, userId } = req.params;

        // Validate đầu vào
        const schema = z.object({
            role: z.nativeEnum(institute_role).optional(),
            student_id_code: z.string().optional(),
            is_verified_by_institute: z.boolean().optional()
        });

        const body = schema.parse(req.body);

        const result = await InstituteMemberService.updateMember(requesterId, id, userId, body);
        res.status(200).json({ message: "Cập nhật thành công!", data: result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
  }
}