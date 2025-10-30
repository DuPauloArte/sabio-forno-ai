// Local: src/receitas/dto/create-receita.dto.ts
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ReceitaInsumoDto } from './receita-insumo.dto';

export class CreateReceitaDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  @IsInt()
  rendimento_porcoes?: number;

  @IsNumber()
  @IsNotEmpty()
  lucro_desejado: number; // Em porcentagem, ex: 30

  // Aqui está a mágica: um array contendo os detalhes dos insumos
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceitaInsumoDto)
  insumos: ReceitaInsumoDto[];
}