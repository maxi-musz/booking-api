import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseHelper } from '../../shared';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      let message: string;

      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object' && 'message' in res) {
        const msg = (res as any).message;
        message = Array.isArray(msg) ? msg.join(', ') : String(msg);
      } else {
        message = exception.message;
      }

      const body = ResponseHelper.error(message, request.path, request.method);
      return response.status(status).json(body);
    }

    // Non-HTTP exceptions
    const body = ResponseHelper.error('Internal server error', request.path, request.method);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}


