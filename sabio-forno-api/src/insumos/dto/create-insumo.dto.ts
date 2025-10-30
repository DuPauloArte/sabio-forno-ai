import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateInsumoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  unidade_compra: string;

  @IsNumber()
  @IsNotEmpty()
  valor_unidade_compra: number;
}