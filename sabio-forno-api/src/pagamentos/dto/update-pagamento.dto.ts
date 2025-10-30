// Local: src/pagamentos/dto/update-pagamento.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateCustoFixoDto } from './create-custo-fixo.dto'; // <-- Caminho e nome corrigidos

export class UpdatePagamentoDto extends PartialType(CreateCustoFixoDto) {} // <-- Classe corrigida