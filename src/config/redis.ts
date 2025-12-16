import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;

// Tạo kết nối Redis
const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null, // Bắt buộc phải set null nếu dùng BullMQ sau này
});

redis.on('connect', () => {
  console.log(`🔌 Redis connected to ${REDIS_HOST}:${REDIS_PORT}`);
});

redis.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err);
});

export default redis;