// Local: src/auth/dto/create-child-user.dto.ts
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateChildUserDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome de usuário não pode estar vazio.' })
  username: string; // Login do usuário filho

  @IsString()
  @IsNotEmpty({ message: 'O nome não pode estar vazio.' })
  name: string; // Nome real do usuário filho

  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' }) // Pode ser mais curta para filhos
  @IsNotEmpty({ message: 'A senha não pode estar vazia.' })
  password: string;
}