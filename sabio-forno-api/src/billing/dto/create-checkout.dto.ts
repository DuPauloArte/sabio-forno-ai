// Local: sabio-forno-api/src/billing/dto/create-checkout.dto.ts
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

// Define os "planos" que aceitamos da API
const validPlanTypes = ['Pro', 'Elite', 'Master'];

export class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(validPlanTypes, { message: 'Plano inválido.' })
  planType: 'Pro' | 'Elite' | 'Master';
}