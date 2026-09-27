export interface PaymentChargeResult {
  success: boolean;
  transactionId: string;
}

export interface PaymentService {
  charge(amount: number): Promise<PaymentChargeResult>;
}
