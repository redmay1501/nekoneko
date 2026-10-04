import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { USER_MESSAGES } from '@/lib/constants/messages';
import { logger } from '@/lib/utils/logger';
import { NotFoundError, UnauthenticatedError } from './errors';

export interface ApiErrorBody {
  error: string;
}

/**
 * Bọc mọi Route Handler: trả JSON khi thành công, đổi lỗi thành câu tiếng Việt thân thiện,
 * và ghi log đủ ngữ cảnh cho lập trình viên. Không bao giờ nuốt lỗi im lặng.
 */
export async function handleApiRoute<T>(routeName: string, handler: () => Promise<T>): Promise<NextResponse> {
  try {
    return NextResponse.json(await handler());
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json<ApiErrorBody>({ error: USER_MESSAGES.SIGN_IN_REQUIRED }, { status: 401 });
    }
    if (error instanceof ZodError) {
      logger.warn(`${routeName}: dữ liệu không hợp lệ`, { issues: error.issues });
      return NextResponse.json<ApiErrorBody>({ error: USER_MESSAGES.INVALID_INPUT }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json<ApiErrorBody>({ error: USER_MESSAGES.NOT_FOUND }, { status: 404 });
    }
    logger.error(`${routeName}: lỗi không mong đợi`, error);
    return NextResponse.json<ApiErrorBody>({ error: USER_MESSAGES.GENERIC_ERROR }, { status: 500 });
  }
}
