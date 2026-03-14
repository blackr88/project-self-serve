import prisma from '@/lib/prisma';
import { getCurrentUser, requireAdmin, hashPassword, isValidEmail, isValidPassword } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/response';
import { MAX_PAGES_PER_USER } from '@/lib/constants';

/**
 * GET /api/admin/users
 * List all users (admin only)
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { user, isAdmin } = await requireAdmin();
    if (!user) return unauthorizedResponse();
    if (!isAdmin) return errorResponse('Admin access required', 403);

    const users = await prisma.user.findMany({
      orderBy: { created_at: 'desc' },
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

    const formatted = users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      totalPages: u._count.pages,
      created_at: u.created_at,
    }));

    return successResponse({
      users: formatted,
      totalUsers: formatted.length,
    });
  } catch (error) {
    console.error('List users error:', error);
    return serverErrorResponse('Failed to fetch users');
  }
}

/**
 * POST /api/admin/users
 * Create a new user (admin only)
 */
export async function POST(request) {
  try {
    const { user, isAdmin } = await requireAdmin();
    if (!user) return unauthorizedResponse();
    if (!isAdmin) return errorResponse('Admin access required', 403);

    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required');
    }

    if (!isValidEmail(email)) {
      return errorResponse('Please provide a valid email address');
    }

    if (!isValidPassword(password)) {
      return errorResponse('Password must be between 8 and 128 characters');
    }

    // Only allow 'admin' or 'user' roles
    const userRole = role === 'admin' ? 'admin' : 'user';

    // Check existing
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return errorResponse('An account with this email already exists', 409);
    }

    const password_hash = await hashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password_hash,
        role: userRole,
      },
    });

    return successResponse(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          created_at: newUser.created_at,
        },
        message: 'User created successfully',
      },
      201
    );
  } catch (error) {
    console.error('Create user error:', error);
    return serverErrorResponse('Failed to create user');
  }
}
