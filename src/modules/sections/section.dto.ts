import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSectionDto {
  @ApiProperty()
  @IsString() @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsUUID()
  courseId: string;
}

export class UpdateSectionDto {
  @ApiPropertyOptional()
  @IsString() @IsNotEmpty()
  name: string;
}
