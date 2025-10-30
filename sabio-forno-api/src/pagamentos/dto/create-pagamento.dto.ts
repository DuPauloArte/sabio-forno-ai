// Local: src/pagamentos/dto/create-pagamento.dto.ts
import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePagamentoDto {
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsNumber()
  @IsNotEmpty()
  valor: number;

  @IsDateString()
  data: string;

  @IsInt()
  fechamentoCaixaId: number;

  @IsOptional()
  @IsInt()
  custoMensalId?: number;
}