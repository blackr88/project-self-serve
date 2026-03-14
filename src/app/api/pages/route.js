import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/response';
import { MAX_PAGES_PER_USER } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const pages = await prisma.page.findMany({
      where: { user_id: user.userId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        subdomain: true,
        file_count: true,
        total_size: true,
        created_at: true,
        updated_at: true,
      },
    });

    const totalPages = pages.length;
    const remainingPages = MAX_PAGES_PER_USER - totalPages;

    return successResponse({
      pages,
      stats: {
        total: totalPages,
        remaining: remainingPages,
        limit: MAX_PAGES_PER_USER,
      },
    });
  } catch (error) {
    console.error('Get pages error:', error);
    return serverErrorResponse('Failed to fetch pages');
  }
}
