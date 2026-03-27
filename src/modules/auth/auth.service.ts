import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/core/database/prisma.service';
import { ChangePasswordDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) { }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('Bu telefon raqam allaqachon ro\'yxatdan o\'tgan');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { phone: dto.phone, fullName: dto.fullName, password: hashed, role: UserRole.ADMIN },
      select: { id: true, phone: true, fullName: true, role: true, createdAt: true },
    });

    const token = await this.signToken(user.id, user.role);

    return {
      success: true,
      data: user,
      token
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new UnauthorizedException('Telefon yoki parol noto`g`ri');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Telefon yoki parol noto`g`ri');

    const { password, ...safeUser } = user;
    const token = await this.signToken(user.id, user.role);
    return { user: safeUser, token };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: {
        id: true, phone: true, fullName: true, role: true, image: true, createdAt: true,
        mentorProfile: true,
      },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return user;
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!valid) throw new UnauthorizedException('Eski parol noto\'g\'ri');

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { message: 'Parol muvaffaqiyatli o\'zgartirildi' };
  }

  private async signToken(userId: number, role: string) {
    return await this.jwt.sign({ id: userId, role });
  }
}
