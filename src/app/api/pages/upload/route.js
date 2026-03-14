import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { validateSubdomain } from '@/lib/subdomain';
import { saveHtmlFile, saveZipFile, validateFileType, MAX_UPLOAD_SIZE } from '@/lib/storage';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/response';
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit';
import { MAX_PAGES_PER_USER, getPageUrl } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    // Rate limiting
    const ip = getClientIp(request);
    const { allowed } = checkRateLimit(`upload:${user.userId}`, RATE_LIMITS.UPLOAD.maxRequests, RATE_LIMITS.UPLOAD.windowMs);
    if (!allowed) {
      return errorResponse('Upload rate limit exceeded. Please try again later.', 429);
    }

    // Check page limit
    const pageCount = await prisma.page.count({
      where: { user_id: user.userId },
    });

    if (pageCount >= MAX_PAGES_PER_USER) {
      return errorResponse(`You have reached the maximum limit of ${MAX_PAGES_PER_USER} pages. Please delete existing pages before uploading new ones.`, 403);
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    const subdomain = formData.get('subdomain');

    if (!file) {
      return errorResponse('No file uploaded');
    }

    if (!subdomain) {
      return errorResponse('Subdomain is required');
    }

    // Validate subdomain
    const subdomainValidation = validateSubdomain(subdomain);
    if (!subdomainValidation.valid) {
      return errorResponse(subdomainValidation.error);
    }

    const normalizedSubdomain = subdomain.toLowerCase().trim();

    // Check subdomain uniqueness
    const existingPage = await prisma.page.findUnique({
      where: { subdomain: normalizedSubdomain },
    });

    if (existingPage) {
      if (existingPage.user_id !== user.userId) {
        return errorResponse('This subdomain is already taken by another user');
      }
      // User is re-uploading to their own subdomain - will overwrite
    }

    // Validate file type
    const fileValidation = validateFileType(file.name);
    if (!fileValidation.valid) {
      return errorResponse('Only HTML (.html, .htm) and ZIP (.zip) files are allowed');
    }

    // Validate file size
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_UPLOAD_SIZE) {
      return errorResponse(`File size exceeds maximum of ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`);
    }

    // Process file based on type
    let result;
    try {
      if (fileValidation.type === 'html') {
        result = await saveHtmlFile(normalizedSubdomain, buffer, file.name);
      } else if (fileValidation.type === 'zip') {
        result = await saveZipFile(normalizedSubdomain, buffer);
      }
    } catch (uploadError) {
      console.error('File processing error:', uploadError);
      return errorResponse(`File processing failed: ${uploadError.message}`);
    }

    // Upsert page record
    const page = await prisma.page.upsert({
      where: { subdomain: normalizedSubdomain },
      update: {
        folder_path: result.folderPath,
        file_count: result.fileCount,
        total_size: result.totalSize,
        updated_at: new Date(),
      },
      create: {
        user_id: user.userId,
        subdomain: normalizedSubdomain,
        folder_path: result.folderPath,
        file_count: result.fileCount,
        total_size: result.totalSize,
      },
    });

    return successResponse(
      {
        page: {
          id: page.id,
          subdomain: page.subdomain,
          url: getPageUrl(page.subdomain),
          file_count: page.file_count,
          total_size: page.total_size,
          created_at: page.created_at,
        },
        message: 'Page uploaded successfully',
      },
      201
    );
  } catch (error) {
    console.error('Upload error:', error);
    return serverErrorResponse('Failed to upload page');
  }
}
