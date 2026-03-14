import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { deleteSubdomainDir } from '@/lib/storage';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/response';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    // Rate limiting
    const { allowed } = checkRateLimit(`delete:${user.userId}`, RATE_LIMITS.DELETE.maxRequests, RATE_LIMITS.DELETE.windowMs);
    if (!allowed) {
      return errorResponse('Too many delete requests. Please try again later.', 429);
    }

    const { id } = params;

    if (!id) {
      return errorResponse('Page ID is required');
    }

    // Find the page
    const page = await prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      return notFoundResponse('Page not found');
    }

    // Check ownership
    if (page.user_id !== user.userId) {
      return errorResponse('You do not have permission to delete this page', 403);
    }

    // Delete files from storage
    await deleteSubdomainDir(page.subdomain);

    // Delete from database
    await prisma.page.delete({
      where: { id },
    });

    return successResponse({
      message: 'Page deleted successfully',
      subdomain: page.subdomain,
    });
  } catch (error) {
    console.error('Delete page error:', error);
    return serverErrorResponse('Failed to delete page');
  }
}
