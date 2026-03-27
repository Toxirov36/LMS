import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();

            let authHeader = request.headers.authorization;

            if (!authHeader) throw new UnauthorizedException("Token yoq")

             authHeader = authHeader.split(" ")[1]

            let user = await this.jwtService.verify(authHeader)
                        
            request["user"] = user

            return true

        } catch (error) {
            throw new UnauthorizedException("Invalid token")
        }
    }
}