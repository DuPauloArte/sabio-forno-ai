// Local: sabio-forno-api/src/billing/dto/update-billing.dto.ts

import { PartialType } from '@nestjs/mapped-types';
// CORREÇÃO: Importa a classe correta do arquivo que renomeamos
import { CreateCheckoutDto } from './create-checkout.dto';

// A classe pode manter seu nome original 'UpdateBillingDto' (ou você pode renomeá-la para UpdateCheckoutDto)
// O importante é que ela estenda a classe correta.
export class UpdateBillingDto extends PartialType(CreateCheckoutDto) {}