import { Request, Response } from 'express';
import { InstituteService } from '../services/institute.verification.service';
import { z } from 'zod';

export class InstituteController {

  // [POST] Register
  static async register(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const schema = z.object({
        name: z.string().min(3),
        slug: z.string().regex(/^[a-z0-9-]+$/).min(3),
        description: z.string().optional(),
        proof_documents: z.array(z.string().url()).min(1),
        submit_note: z.string().optional()
      });
      const body = schema.parse(req.body);
      
      const result = await InstituteService.registerInstitute(userId, {
        name: body.name, slug: body.slug, description: body.description,
        proofDocuments: body.proof_documents, submitNote: body.submit_note
      });
      res.status(201).json({ message: "Đăng ký thành công", data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // [POST] Resubmit
  static async resubmit(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const schema = z.object({
        proof_documents: z.array(z.string().url()).min(1),
        submit_note: z.string().optional()
      });
      const body = schema.parse(req.body);
      const result = await InstituteService.resubmitVerification(userId, id, body.proof_documents, body.submit_note);
      res.status(200).json({ message: "Gửi lại thành công", data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // [GET] My List
  static async getMyList(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const result = await InstituteService.getMyInstitutes(userId);
      res.status(200).json({ data: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // [PUT] Update Info
  static async updateInfo(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const schema = z.object({
        description: z.string().optional(),
        logo_url: z.string().url().optional(),
        website: z.string().url().optional()
      });
      const body = schema.parse(req.body);
      const result = await InstituteService.updateInstituteInfo(userId, id, {
        description: body.description, logoUrl: body.logo_url, website: body.website
      });
      res.status(200).json({ message: "Cập nhật thành công", data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // [GET] Admin Pending List
  static async getPendingList(req: Request, res: Response) {
    try {
      const result = await InstituteService.getPendingRequests();
      res.status(200).json({ data: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // [PUT] Admin Verify
  static async verifyProcess(req: Request, res: Response) {
    try {
      const adminId = (req as any).user.id;
      const { id } = req.params;
      const schema = z.object({ status: z.enum(['approved', 'rejected']), feedback: z.string().optional() });
      const body = schema.parse(req.body) as any;
      const result = await InstituteService.verifyRequest(id, adminId, body.status, body.feedback);
      res.status(200).json({ message: "Đã xử lý xong", data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // [GET] Public List
  static async getPublicList(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const search = req.query.search as string;
      const result = await InstituteService.getPublicVerifiedInstitutes(page, search);
      res.status(200).json({ data: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // 👇 [MỚI] [GET] Public Detail
  static async getDetail(req: Request, res: Response) {
    try {
      const { slugOrId } = req.params;
      const result = await InstituteService.getInstitutePublicDetail(slugOrId);
      res.status(200).json({ data: result });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
}