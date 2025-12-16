import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import các Routes (Hiện tại mới có Auth)
import authRoutes from './routes/auth.routes';

// Load biến môi trường
dotenv.config();

const app = express();

// ==========================================
// 1. MIDDLEWARES
// ==========================================

// Bảo mật HTTP Headers
app.use(helmet());

// Cho phép Frontend (React/Vue/Postman) gọi API
// Sau này deploy production nên sửa "*" thành domain cụ thể của bạn
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));

// Log request ra terminal để debug (chỉ hiện khi chạy dev)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Chấp nhận dữ liệu JSON và Form từ Client gửi lên
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 2. ROUTES
// ==========================================

// API Health Check (Để biết Server còn sống hay chết)
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: '🚀 Edunity API System is Running!',
    timestamp: new Date().toISOString()
  });
});

// Gắn Auth Routes
app.use('/api/auth', authRoutes);

// ==========================================
// 3. ERROR HANDLING (Hứng lỗi toàn hệ thống)
// ==========================================

// Nếu người dùng gọi vào link không tồn tại (404)
app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new Error('Not Found');
  res.status(404).json({
    error: {
      message: error.message
    }
  });
});

// Hứng các lỗi 500 (Lỗi code, lỗi DB...)
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('🔥 Global Error:', error); // In lỗi ra terminal server
  res.status(error.status || 500).json({
    error: {
      message: error.message || 'Internal Server Error'
    }
  });
});

export default app;