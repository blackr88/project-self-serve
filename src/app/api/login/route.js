import prisma from '@/lib/prisma';
import { comparePassword, generateToken, isValidEmail, getAuthCookieOptions } from '@/lib/auth';
import { errorResponse, successResponse, serverErrorResponse } from '@/lib/response';
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit';

/**
 * Track failed login attempts per account to prevent brute force
 * Key: email, Value: { count, lockedUntil }
 */
const loginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of loginAttempts.entries()) {
    if (val.lockedUntil && now > val.lockedUntil) {
      loginAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000);

function checkAccountLock(email) {
  const record = loginAttempts.get(email);
  if (!record) return { locked: false };

  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const remainingMs = record.lockedUntil - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);
    return { locked: true, remainingMin };
  }

  // Lock expired, reset
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    loginAttempts.delete(email);
  }
  return { locked: false };
}

function recordFailedLogin(email) {
  const record = loginAttempts.get(email) || { count: 0, lockedUntil: null };
  record.count++;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }

  loginAttempts.set(email, record);
}

function clearFailedLogins(email) {
  loginAttempts.delete(email);
}

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // IP-based rate limiting
    const ip = getClientIp(request);
    const { allowed } = checkRateLimit(`login:${ip}`, RATE_LIMITS.AUTH.maxRequests, RATE_LIMITS.AUTH.windowMs);
    if (!allowed) {
      return errorResponse('Too many login attempts. Please try again later.', 429);
    }

    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return errorResponse('Email and password are required');
    }

    if (!isValidEmail(email)) {
      return errorResponse('Please provide a valid email address');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check account lockout
    const lockStatus = checkAccountLock(normalizedEmail);
    if (lockStatus.locked) {
      return errorResponse(
        `Account temporarily locked due to too many failed attempts. Try again in ${lockStatus.remainingMin} minutes.`,
        429
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Use same generic message for both "user not found" and "wrong password"
    // to prevent user enumeration
    if (!user) {
      recordFailedLogin(normalizedEmail);
      // Add small delay to prevent timing attacks
      await new Promise((r) => setTimeout(r, 100 + Math.random() * 200));
      return errorResponse('Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      recordFailedLogin(normalizedEmail);
      return errorResponse('Invalid email or password', 401);
    }

    // Success → clear failed attempts
    clearFailedLogins(normalizedEmail);

    // Generate JWT
    const token = generateToken(user);

    // Set cookie
    const response = successResponse({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      message: 'Logged in successfully',
    });

    response.cookies.set('auth_token', token, getAuthCookieOptions());

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return serverErrorResponse('Failed to login');
  }
}
