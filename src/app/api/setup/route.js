import prisma from '@/lib/prisma';
import { hashPassword, generateToken, isValidEmail, isValidPassword, getAuthCookieOptions } from '@/lib/auth';
import { errorResponse, successResponse, serverErrorResponse } from '@/lib/response';
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit';

/**
 * POST /api/setup
 * Create the first admin account. This endpoint ONLY works
 * when setup_complete is false AND no admin exists.
 * After first admin is created, this endpoint is permanently disabled.
 */
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const { allowed } = checkRateLimit(`setup:${ip}`, 5, 15 * 60 * 1000);
    if (!allowed) {
      return errorResponse('Too many attempts. Please try again later.', 429);
    }

    // Check if setup is already complete
    const settings = await prisma.appSetting.findUnique({
      where: { id: 'app_settings' },
    });

    const adminExists = await prisma.user.count({ where: { role: 'admin' } });

    if ((settings?.setup_complete) || adminExists > 0) {
      return errorResponse('Setup has already been completed. Use the login page.', 403);
    }

    const body = await request.json();
    const { email, password, confirmPassword } = body;

    // Validation
    if (!email || !password) {
      return errorResponse('Email and password are required');
    }

    if (!isValidEmail(email)) {
      return errorResponse('Please provide a valid email address');
    }

    if (!isValidPassword(password)) {
      return errorResponse('Password must be between 8 and 128 characters');
    }

    if (password !== confirmPassword) {
      return errorResponse('Passwords do not match');
    }

    // Create admin user
    const password_hash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password_hash,
        role: 'admin',
      },
    });

    // Mark setup as complete
    await prisma.appSetting.upsert({
      where: { id: 'app_settings' },
      update: { setup_complete: true },
      create: { id: 'app_settings', setup_complete: true },
    });

    // Generate JWT with admin role
    const token = generateToken(user);

    const response = successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        message: 'Admin account created. Setup complete!',
      },
      201
    );

    response.cookies.set('auth_token', token, getAuthCookieOptions());

    return response;
  } catch (error) {
    console.error('Setup error:', error);
    return serverErrorResponse('Failed to complete setup');
  }
}
