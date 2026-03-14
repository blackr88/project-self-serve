import prisma from '@/lib/prisma';
import { successResponse, serverErrorResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/setup/status
 * Public endpoint - checks if the platform has been set up
 * (i.e., at least one admin account exists)
 */
export async function GET() {
  try {
    const settings = await prisma.appSetting.findUnique({
      where: { id: 'app_settings' },
    });

    // Also double-check that an admin actually exists
    const adminCount = await prisma.user.count({
      where: { role: 'admin' },
    });

    const setupComplete = settings?.setup_complete === true && adminCount > 0;

    return successResponse({
      setupComplete,
    });
  } catch (error) {
    console.error('Setup status error:', error);
    return serverErrorResponse('Failed to check setup status');
  }
}
