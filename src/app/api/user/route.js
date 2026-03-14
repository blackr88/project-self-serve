import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/response';
import { MAX_PAGES_PER_USER } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true,
        _count: {
          select: { pages: true },
        },
      },
    });

    if (!user) {
      return unauthorizedResponse('User not found');
    }

    // Get recent pages
    const recentPages = await prisma.page.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        id: true,
        subdomain: true,
        file_count: true,
        total_size: true,
        created_at: true,
      },
    });

    // Get total storage used
    const storageUsed = await prisma.page.aggregate({
      where: { user_id: user.id },
      _sum: { total_size: true },
    });

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
      stats: {
        totalPages: user._count.pages,
        remainingPages: MAX_PAGES_PER_USER - user._count.pages,
        limit: MAX_PAGES_PER_USER,
        totalStorage: storageUsed._sum.total_size || 0,
      },
      recentPages,
    });
  } catch (error) {
    console.error('Get user info error:', error);
    return serverErrorResponse('Failed to fetch user info');
  }
}
