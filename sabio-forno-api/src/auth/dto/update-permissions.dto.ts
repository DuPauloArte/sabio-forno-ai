// Local: src/auth/dto/update-permissions.dto.ts
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdatePermissionsDto {
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  unidadeIds?: number[];

  // --- NOVO CAMPO AQUI ---
  @IsArray()
  @IsString({ each: true }) // Garante que cada item seja uma string
  @IsOptional()
  allowedPages?: string[]; // Ex: ["insumos", "receitas", "custos"]
}