// Local: src/unidades/dto/create-unidade.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUnidadeDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}