import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { validateSubdomain } from '@/lib/subdomain';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');

    if (!subdomain) {
      return errorResponse('Subdomain parameter is required');
    }

    const validation = validateSubdomain(subdomain);
    if (!validation.valid) {
      return successResponse({
        available: false,
        reason: validation.error,
      });
    }

    const existing = await prisma.page.findUnique({
      where: { subdomain: subdomain.toLowerCase().trim() },
      select: { user_id: true },
    });

    if (existing) {
      const isOwner = existing.user_id === user.userId;
      return successResponse({
        available: false,
        isOwner,
        reason: isOwner
          ? 'You already own this subdomain. Uploading will overwrite existing content.'
          : 'This subdomain is already taken',
      });
    }

    return successResponse({
      available: true,
      reason: null,
    });
  } catch (error) {
    console.error('Check subdomain error:', error);
    return errorResponse('Failed to check subdomain availability', 500);
  }
}
