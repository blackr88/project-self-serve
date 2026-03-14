import prisma from '@/lib/prisma';
import { getCurrentUser, comparePassword, hashPassword, isValidPassword } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/response';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function PUT(request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const { allowed } = checkRateLimit(`password:${currentUser.userId}`, 5, 15 * 60 * 1000);
    if (!allowed) {
      return errorResponse('Too many password change attempts. Please try again later.', 429);
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword) {
      return errorResponse('Current password and new password are required');
    }

    if (!isValidPassword(newPassword)) {
      return errorResponse('New password must be between 8 and 128 characters');
    }

    if (newPassword !== confirmPassword) {
      return errorResponse('New passwords do not match');
    }

    if (currentPassword === newPassword) {
      return errorResponse('New password must be different from current password');
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (!user) {
      return unauthorizedResponse('User not found');
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return errorResponse('Current password is incorrect', 401);
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: newHash },
    });

    return successResponse({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return serverErrorResponse('Failed to change password');
  }
}
