import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEmpty, IsNotEmpty, IsString, IsStrongPassword, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: '998901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '@Parol2026', minLength: 8 })
  @IsStrongPassword()
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: '998881411505' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '@Parol2026' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
