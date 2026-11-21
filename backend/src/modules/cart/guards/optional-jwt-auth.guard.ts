import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any
  ): TUser {
    // If an access token was provided in cookies or Authorization header but expired,
    // throw 401 Unauthorized so that client interceptors can trigger a silent token refresh
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Access token expired');
    }
    // If an error occurred or no user was resolved (e.g. unauthenticated guest), return null
    return (user || null) as TUser;
  }
}
