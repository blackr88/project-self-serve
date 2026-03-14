import { successResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = successResponse({ message: 'Logged out successfully' });

  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
