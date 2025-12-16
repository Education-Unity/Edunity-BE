import http from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import app from './app';
import redis from './config/redis'; // File redis.ts bạn đã tạo ở bước Infrastructure

const PORT = process.env.PORT || 3000;

// 1. Tạo HTTP Server từ Express App
const httpServer = http.createServer(app);

// 2. Cấu hình Socket.io (Real-time Engine)
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Cho phép mọi nguồn kết nối socket
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'] // Ưu tiên websocket
});

// 3. Cấu hình Redis Adapter cho Socket.io
// (Giúp đồng bộ tin nhắn chat khi chạy nhiều server)
const pubClient = redis.duplicate({ lazyConnect: true });
const subClient = redis.duplicate({ lazyConnect: true });

// Đảm bảo Redis kết nối xong mới gắn vào Socket.io
Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Socket.io Redis Adapter configured successfully');
  })
  .catch((err) => {
    // Nếu không có Redis (chạy local chưa bật docker), vẫn cho server chạy nhưng báo warning
    console.warn('⚠️ Warning: Failed to connect Redis Adapter. Socket.io running in memory mode.');
    console.warn('   Error details:', err.message);
  });

// 4. Lắng nghe kết nối Socket
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Test sự kiện join room
  socket.on('join_classroom', (classroomId) => {
    socket.join(classroomId);
    console.log(`User ${socket.id} joined room ${classroomId}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// 5. Khởi chạy Server
httpServer.listen(PORT, () => {
  console.log(`
  ==========================================
  🚀 EDUNITY SERVER IS RUNNING
  ==========================================
  👉 URL:     http://localhost:${PORT}
  👉 Mode:    ${process.env.NODE_ENV || 'development'}
  👉 Socket:  Ready
  ==========================================
  `);
});

// Export io để dùng ở các Controller khác (ví dụ: thông báo khi có bài tập mới)
export { io };