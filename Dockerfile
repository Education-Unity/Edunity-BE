# 1. Chọn Base Image nhẹ nhất (Alpine)
FROM node:20-alpine

# 2. Tạo thư mục làm việc trong container
WORKDIR /app

# 3. Copy file định nghĩa package trước (để tận dụng cache của Docker)
COPY package*.json ./
COPY prisma ./prisma/

# 4. Cài đặt dependencies
RUN npm install

# 5. Copy toàn bộ source code vào container
COPY . .

# 6. Generate Prisma Client (Bắt buộc phải chạy lại trong môi trường Linux của Docker)
RUN npx prisma generate

# 7. Build TypeScript sang JavaScript
RUN npm run build

# 8. Mở cổng 3000
EXPOSE 3000

# 9. Lệnh chạy server khi container khởi động
CMD ["npm", "start"]