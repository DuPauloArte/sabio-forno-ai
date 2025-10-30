// Local: sabio-forno-api/src/caixa/dto/update-caixa.dto.ts

import { IsNumber, IsOptional } from 'class-validator';

export class UpdateCaixaDto {
  @IsOptional()
  @IsNumber({}, { message: 'Vendas em dinheiro devem ser um número.' })
  vendasDinheiro?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Vendas no cartão devem ser um número.' })
  vendasCartao?: number;

  // REMOVIDO: A propriedade despesasGerais foi removida daqui
  // @IsOptional()
  // @IsNumber()
  // despesasGerais?: number;

  @IsOptional()
  @IsNumber({}, { message: 'O troco deve ser um número.' })
  trocoDiaSeguinte?: number;
}