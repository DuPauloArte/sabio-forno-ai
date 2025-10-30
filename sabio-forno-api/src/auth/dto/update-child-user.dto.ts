// Local: src/auth/dto/update-child-user.dto.ts
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateChildUserDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome не pode estar vazio.' })
  name: string; // Novo nome para o usuário filho

  @IsOptional() // A senha só é enviada se o Pai quiser redefini-la
  @IsString()
  @MinLength(6, { message: 'A nova senha deve ter no mínimo 6 caracteres.' })
  password?: string; // Nova senha (opcional)
}