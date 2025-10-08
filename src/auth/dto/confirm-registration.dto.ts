import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Length, MinLength } from 'class-validator';

export class ConfirmRegistrationDto {
  @ApiProperty({ example: 'usuario@exemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @Length(4, 10)
  code: string;

  @ApiProperty({ example: 'SenhaSegura123' })
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'SenhaSegura123' })
  @MinLength(6)
  confirmPassword: string;
}
