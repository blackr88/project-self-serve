import prisma from '@/lib/prisma';
import { requireAdmin, hashPassword, isValidPassword } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/response';
import { deleteSubdomainDir } from '@/lib/storage';

/**
 * DELETE /api/admin/users/[id]
 * Delete a user and all their pages (admin only)
 */
export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const { user, isAdmin } = await requireAdmin();
    if (!user) return unauthorizedResponse();
    if (!isAdmin) return errorResponse('Admin access required', 403);

    const { id } = params;

    // Prevent self-deletion
    if (id === user.userId) {
      return errorResponse('You cannot delete your own account', 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { pages: true },
    });

    if (!targetUser) {
      return notFoundResponse('User not found');
    }

    // Delete all user's page files
    for (const page of targetUser.pages) {
      await deleteSubdomainDir(page.subdomain);
    }

    // Cascade delete will handle pages in DB
    await prisma.user.delete({ where: { id } });

    return successResponse({
      message: `User ${targetUser.email} and ${targetUser.pages.length} pages deleted`,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return serverErrorResponse('Failed to delete user');
  }
}

/**
 * PUT /api/admin/users/[id]
 * Update user role or reset password (admin only)
 */
export async function PUT(request, { params }) {
  try {
    const { user, isAdmin } = await requireAdmin();
    if (!user) return unauthorizedResponse();
    if (!isAdmin) return errorResponse('Admin access required', 403);

    const { id } = params;
    const body = await request.json();
    const { role, newPassword } = body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return notFoundResponse('User not found');
    }

    const updateData = {};

    // Update role
    if (role && ['admin', 'user'].includes(role)) {
      // Prevent removing last admin
      if (role === 'user' && targetUser.role === 'admin') {
        const adminCount = await prisma.user.count({ where: { role: 'admin' } });
        if (adminCount <= 1) {
          return errorResponse('Cannot remove the last admin account', 400);
        }
      }
      updateData.role = role;
    }

    // Reset password
    if (newPassword) {
      if (!isValidPassword(newPassword)) {
        return errorResponse('Password must be between 8 and 128 characters');
      }
      updateData.password_hash = await hashPassword(newPassword);
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse('No valid fields to update');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, role: true },
    });

    return successResponse({
      user: updated,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    return serverErrorResponse('Failed to update user');
  }
}
