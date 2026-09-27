import { randomUUID } from 'crypto';
import { injectable } from 'tsyringe';

import { PaymentChargeResult, PaymentService } from '@core/services/payment.service';
import { ValidationError } from '@core/errors/validation.error';

/**
 * Pasarela de pago simulada (sin integración real a Stripe/PayPal/etc.).
 * Autoriza cualquier monto positivo de forma determinística.
 */
@injectable()
export class FakePaymentService implements PaymentService {
  public async charge(amount: number): Promise<PaymentChargeResult> {
    if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
      throw new ValidationError('El monto a cobrar debe ser mayor a 0');
    }

    return {
      success: true,
      transactionId: `SIM-${randomUUID()}`,
    };
  }
}
