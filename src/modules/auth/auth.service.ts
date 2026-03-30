import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/core/database/prisma.service';
import { ChangePasswordDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { UserRole } from '@prisma/client';
import { RedisService } from 'src/core/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    // private redis: RedisService,
  ) { }

  // generateOtp() { 
  //   return Math.floor(100000 + Math.random() * 900000).toString();
  // }

  // async sendOtp(email: string) {
  //   const code = this.generateOtp();

  //   await this.redis.set(`otp:${email}`, code, 300);

  //   await this.sendEmail(email, code);

  //   return { message: 'OTP sent (Redis)' };
  // }

  // async verifyOtp(email: string, code: string) {
  //   const stored = await this.redis.get(`otp:${email}`);

  //   if (!stored || stored !== code) {
  //     throw new BadRequestException('Invalid OTP');
  //   }

  //   await this.redis.del(`otp:${email}`);

  //   return true;
  // }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('Bu telefon raqam allaqachon royxatdan otgan');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { phone: dto.phone, fullName: dto.fullName, password: hashed },
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

    const { password,role,createdAt, ...safeUser } = user;
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
    if (!valid) throw new UnauthorizedException('Eski parol notogri');

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { message: 'Parol muvaffaqiyatli ozgartirildi' };
  }

  private async signToken(userId: number, role: string) {
    return await this.jwt.sign({ id: userId, role });
  }
}
