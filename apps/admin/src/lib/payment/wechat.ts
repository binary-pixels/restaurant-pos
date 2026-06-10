import { CreatePaymentParams, PaymentResult, PaymentGateway } from "./interface";

/**
 * WeChat Pay JSAPI integration.
 *
 * Production requires:
 * - WECHAT_APPID, WECHAT_MCHID, WECHAT_API_V3_KEY env vars
 * - WeChat Pay merchant certificate
 *
 * Simulated mode (default) returns mock success for development/testing.
 */

const USE_SIMULATION = !process.env.WECHAT_MCHID;

function simulatePrepay(orderNo: string): Record<string, string> {
  return {
    prepayId: "wx_sim_" + Date.now(),
    nonceStr: Math.random().toString(36).slice(2),
    timeStamp: String(Math.floor(Date.now() / 1000)),
    signType: "RSA",
    paySign: "simulated_sign_" + orderNo,
  };
}

async function createWeChatPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  if (USE_SIMULATION) {
    return {
      success: true,
      prepayData: simulatePrepay(params.orderNo),
      gatewayRef: "sim_" + params.orderNo,
    };
  }

  // === Production WeChat Pay JSAPI ===
  // 1. POST https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi
  //    with merchant cert, appid, mchid, openid, amount, description, out_trade_no
  // 2. Parse response → prepay_id
  // 3. Generate appId, timeStamp, nonceStr, package, signType, paySign
  // 4. Return prepayData for wx.requestPayment()

  throw new Error("WeChat Pay production not configured. Set WECHAT_MCHID.");
}

async function verifyCallback(data: any) {
  if (USE_SIMULATION) {
    return {
      orderId: data.out_trade_no || "",
      transactionId: "sim_txn_" + Date.now(),
      amount: data.amount?.total ? data.amount.total / 100 : 0,
    };
  }

  // Production: verify signature, decrypt resource, return order info
  throw new Error("WeChat Pay production not configured.");
}

async function refund(transactionId: string, amount?: number) {
  if (USE_SIMULATION) return true;
  throw new Error("WeChat Pay production not configured.");
}

export const wechatPayGateway: PaymentGateway = {
  name: "wechat_jsapi",
  createPayment: createWeChatPayment,
  verifyCallback,
  refund,
};
