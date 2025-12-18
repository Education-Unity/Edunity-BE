import { Request, Response } from 'express';
import { ClassroomService } from '../services/classroom.service';
import { z } from 'zod';

export class ClassroomController {

  // POST /api/classrooms
  static async create(req: Request, res: Response) {
    try {
      const ownerId = (req as any).user.id;

      // Validate dữ liệu đầu vào
      const schema = z.object({
        title: z.string().min(3, "Tên lớp học phải có ít nhất 3 ký tự"),
        description: z.string().optional(),
        // Validate Enum: Chỉ chấp nhận các giá trị trong list này
        enrollment_type: z.enum(['public', 'password', 'request', 'paid', 'institute_only']).optional(),
        access_code: z.string().optional(),
        price: z.number().min(0).optional()
      }).refine((data) => {
        // Logic phụ: Nếu chọn type là 'password' thì bắt buộc phải nhập access_code
        if (data.enrollment_type === 'password' && !data.access_code) {
          return false;
        }
        return true;
      }, {
        message: "Bạn phải nhập mã truy cập (access_code) cho lớp học có mật khẩu",
        path: ["access_code"]
      });

      const body = schema.parse(req.body);

      const newClass = await ClassroomService.createClassroom(ownerId, body);

      res.status(201).json({
        message: "Tạo lớp học thành công!",
        data: newClass
      });

    } catch (error: any) {
      // Xử lý lỗi Zod
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const keyword = req.query.keyword as string;
      const myClasses = req.query.me === 'true'; // ?me=true để lấy lớp mình tạo

      const ownerId = myClasses ? (req as any).user.id : undefined;

      const result = await ClassroomService.findAll({ page, limit, keyword, ownerId });
      
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // 👇 [GET] /api/classrooms/:id
  static async getDetail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const classroom = await ClassroomService.findOne(id);
      
      res.status(200).json({ data: classroom });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async join(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params; // ID lớp học
      const { access_code } = req.body; // Mã code (nếu có)

      const result = await ClassroomService.joinClassroom(userId, id, access_code);

      res.status(200).json({
        message: "Tham gia lớp học thành công!",
        data: result
      });

    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async listMembers(req: Request, res: Response) {
    try {
      // Validate xem ID gửi lên có đúng chuẩn UUID không
      const schema = z.object({
        id: z.string().uuid({ message: "ID lớp học không đúng định dạng UUID" })
      });

      // Nếu ID là "CLASS_123" -> Zod sẽ báo lỗi ngay ở đây, không gọi Service nữa
      const { id } = schema.parse(req.params);

      const members = await ClassroomService.getMembers(id);

      res.status(200).json({ data: members });
    } catch (error: any) {
      // Xử lý lỗi Zod
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0].message });
      }
      res.status(404).json({ error: error.message });
    }
  }
}