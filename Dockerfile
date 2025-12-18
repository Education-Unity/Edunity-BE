# 1. Chọn Base Image
FROM node:20-alpine

# 2. Tạo thư mục làm việc
WORKDIR /app

# --- SỬA LẠI DÒNG NÀY ---
# Chỉ cần cài openssl là đủ
RUN apk add --no-cache openssl
# ------------------------

# 3. Copy file package
COPY package*.json ./
COPY prisma ./prisma/

# 4. Cài đặt dependencies
RUN npm install

# 5. Copy toàn bộ source code
COPY . .

# 6. Generate Prisma Client
RUN npx prisma generate

# 7. Build TypeScript
RUN npm run build

# 8. Mở cổng
EXPOSE 3000

# 9. Chạy server
CMD ["npm", "start"]