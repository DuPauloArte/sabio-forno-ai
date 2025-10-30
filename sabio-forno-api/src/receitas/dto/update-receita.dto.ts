// Local: sabio-forno-api/src/receitas/dto/update-receita.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateReceitaDto } from './create-receita.dto';
import { IsNumber, IsOptional, IsPositive, Min } from 'class-validator'; // Importe os validadores

// O PartialType(CreateReceitaDto) já torna todos os campos do create
// (nome, lucro_desejado, rendimento_porcoes, insumos) opcionais.
export class UpdateReceitaDto extends PartialType(CreateReceitaDto) {
  
  // --- CORREÇÃO AQUI ---
  // Adicionamos a propriedade que estava faltando, permitindo que o
  // ValidationPipe a reconheça e não a remova.
  @IsOptional()
  @IsNumber({}, { message: 'O valor praticado deve ser um número.' })
  @Min(0, { message: 'O valor praticado não pode ser negativo.' })
  valor_praticado?: number;
}