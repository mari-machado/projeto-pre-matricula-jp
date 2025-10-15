import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordConfirmDto {
  @ApiProperty({ example: 'NovaSenha@123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'NovaSenha@123' })
  @IsString()
  @MinLength(6)
  confirmPassword: string;
}
