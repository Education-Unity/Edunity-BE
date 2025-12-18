import prisma from '../config/prisma'; // Import instance prisma bạn đã config

export const findProfileByUserId = async (userId: string) => {
  return await prisma.profiles.findUnique({
    where: {
      user_id: userId,
    },
    select: {
      id: true,
      user_id: true,
      full_name: true,
      avatar_url: true,
      role: true,
      created_at: true,
    },
  });
};