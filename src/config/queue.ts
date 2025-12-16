import { Queue, Worker } from 'bullmq';
import redis from './redis';

// 1. Định nghĩa các hàng đợi (Queues)
// Ví dụ: Queue chấm điểm thi
export const examQueue = new Queue('exam-grading', {
  connection: redis,
});

// Ví dụ: Queue gửi email
export const emailQueue = new Queue('email-sending', {
  connection: redis,
});

// 2. Định nghĩa Worker (Người xử lý công việc)
// Worker này sẽ chạy ngầm, lắng nghe khi có job mới
const examWorker = new Worker('exam-grading', async (job) => {
  console.log(`⚙️ Đang chấm bài thi ID: ${job.data.examId} cho User: ${job.data.userId}...`);
  
  // Giả lập xử lý nặng mất 5 giây
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log(`✅ Chấm xong bài thi ID: ${job.data.examId}`);
  return { score: 9.5 }; // Kết quả trả về
}, { 
  connection: redis 
});

export { examWorker };