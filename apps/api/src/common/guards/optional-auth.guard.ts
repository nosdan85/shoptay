import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    info: any,
    context: ExecutionContext,
  ): TUser | null {
    // Don't throw if no token provided - just return null
    if (!user) {
      const request = context.switchToHttp().getRequest();
      request.userId = null;
      return null;
    }
    
    // Set userId on request for convenience
    const request = context.switchToHttp().getRequest();
    request.userId = (user as any).id || (user as any).userId;
    
    return user;
  }
}
