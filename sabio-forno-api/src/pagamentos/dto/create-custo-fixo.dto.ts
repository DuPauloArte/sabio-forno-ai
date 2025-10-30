// Local: sabio-forno-api/src/pagamentos/dto/create-custo-fixo.dto.ts

import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateCustoFixoDto {
  // O nome do tipo de custo. Ex: "Aluguel", "Internet", "Salário"
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio.' })
  nome: string;

  // Um valor padrão opcional. Ex: 1500.00
  // Será usado para preencher automaticamente o custo nos novos meses.
  @IsOptional()
  @IsNumber({}, { message: 'O valor padrão deve ser um número.' })
  valorPadrao?: number;

  // O dia do mês que a conta geralmente vence. Ex: 10
  @IsOptional()
  @IsInt({ message: 'O dia do vencimento deve ser um número inteiro.' })
  @Min(1, { message: 'O dia do vencimento deve ser no mínimo 1.' })
  @Max(31, { message: 'O dia do vencimento deve ser no máximo 31.' })
  diaVencimentoPadrao?: number;
}
