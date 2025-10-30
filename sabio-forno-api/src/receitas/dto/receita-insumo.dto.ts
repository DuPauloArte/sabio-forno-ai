// Local: src/receitas/dto/receita-insumo.dto.ts
import { IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ReceitaInsumoDto {
  @IsInt()
  @IsNotEmpty()
  insumoId: number;

  @IsNumber()
  @IsNotEmpty()
  quantidade_usada: number;

  @IsString()
  @IsNotEmpty()
  medida_usada: string; // Ex: "g", "kg", "ml", "l", "unidade"
}