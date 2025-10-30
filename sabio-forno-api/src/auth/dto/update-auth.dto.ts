import { PartialType } from '@nestjs/mapped-types';
import { RegisterDto } from './register.dto'; // Corrigido para RegisterDto

export class UpdateAuthDto extends PartialType(RegisterDto) {} // Corrigido para RegisterDto