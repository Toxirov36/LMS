import { CanActivate, createParamDecorator, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";


@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.get<UserRole[]>("roles", context.getHandler());

        if (!roles) {
            return true;
        }

        const req = context.switchToHttp().getRequest();

        if (!roles.includes(req.user.role)) {
            throw new ForbiddenException("Sizda bu amalni bajarish huquqi yo'q ")
        }

        return true;
    }
}

export const CurrentUser = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;
        return data ? user?.[data] : user;
    },
);
