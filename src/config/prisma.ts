import { PrismaClient } from '@prisma/client';

// Khai báo biến global để tránh lỗi "Too many connections" 
// khi chạy chế độ development (do nodemon restart server liên tục)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Bật log để nhìn thấy câu lệnh SQL chạy ngầm (rất tiện để debug)
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;