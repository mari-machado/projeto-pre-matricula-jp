import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Matches } from 'class-validator';

export class VerifyResetCodeDto {
  @ApiProperty({ example: 'usuario@exemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '12345', description: 'Código numérico de 5 dígitos' })
  @Matches(/^\d{5}$/,{ message: 'code deve conter 5 dígitos numéricos' })
  code: string;
}
