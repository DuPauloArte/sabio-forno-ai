// Local: src/despesas/dto/create-despesa.dto.ts
import { IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateDespesaDto {
  @IsString()
  @IsNotEmpty({ message: 'A descrição não pode estar vazia.' })
  descricao: string;

  @IsNumber({}, { message: 'O valor deve ser um número.' })
  @IsNotEmpty({ message: 'O valor não pode estar vazio.' })
  valor: number;

  @IsInt()
  fechamentoCaixaId: number; // ID do FechamentoCaixa ao qual esta despesa pertence
}