// Local: sabio-forno-api/src/auth/dto/login.dto.ts

import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  // CORREÇÃO: Removemos o @IsEmail() daqui.
  // Agora aceita qualquer string (email ou username).
  @IsString()
  @IsNotEmpty({ message: 'O email ou nome de usuário não pode estar vazio.' })
  email: string; // Mantemos o nome 'email' para compatibilidade com o frontend

  @IsString()
  @IsNotEmpty({ message: 'A senha não pode estar vazia.' })
  password: string;
}