// Local: src/pagamentos/dto/update-custos-mensais.dto.ts
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, ValidateNested } from 'class-validator';

// Este DTO representa um único item na lista que vamos atualizar
class UpdateCustoMensalItemDto {
  @IsInt()
  id: number; // O ID do CustoMensal a ser atualizado

  @IsNumber()
  valor: number; // O novo valor
}

// Este é o DTO principal que o corpo da requisição deve seguir
export class UpdateCustosMensaisDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCustoMensalItemDto)
  custos: UpdateCustoMensalItemDto[];
}