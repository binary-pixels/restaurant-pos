export interface CreatePaymentParams {
  orderId: string;
  orderNo: string;
  amount: number;
  description: string;
  openId?: string; // WeChat user openId for JSAPI
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  prepayData?: Record<string, string>; // For WeChat JSAPI: prepay_id, nonceStr, etc.
  gatewayRef?: string;
  error?: string;
}

export interface PaymentGateway {
  name: string;
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>;
  verifyCallback(data: any): Promise<{ orderId: string; transactionId: string; amount: number } | null>;
  refund(transactionId: string, amount?: number): Promise<boolean>;
}
