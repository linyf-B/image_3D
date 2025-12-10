import { PaymentOrder, PaymentStatus } from '../types';

// Read configuration from environment variables
// In a real environment, these would be used by a backend service.
// Frontend should typically only receive a code_url, not handle secrets.
const WECHAT_CONFIG = {
  appId: process.env.WECHAT_PAY_APP_ID || '',
  mchId: process.env.WECHAT_PAY_MCH_ID || '',
  notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || '',
  // apiKey should never be exposed to frontend in production
};

/**
 * Simulates creating a WeChat Pay order.
 * In production, this would be an API call to your backend.
 */
export const createWeChatPayOrder = async (amount: number, credits: number): Promise<PaymentOrder> => {
  console.log('Initializing WeChat Pay with config:', {
    appId: WECHAT_CONFIG.appId ? '***' : 'Missing',
    mchId: WECHAT_CONFIG.mchId ? '***' : 'Missing'
  });

  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const orderId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      // Simulate a WeChat "code_url" (weixin://...)
      // We use a dummy URL that contains data to show in the QR code
      const codeUrl = `weixin://wxpay/bizpayurl?pr=${Math.random().toString(36).substring(7)}`;
      
      resolve({
        orderId,
        amount,
        credits,
        status: PaymentStatus.PENDING,
        codeUrl, // The URL to be converted into a QR code
        createdAt: Date.now(),
      });
    }, 800);
  });
};

/**
 * Simulates checking the order status.
 * In production, this would poll your backend which checks WeChat servers.
 */
export const checkOrderStatus = async (orderId: string): Promise<PaymentStatus> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // randomly simulate waiting vs success for demo purposes? 
      // For this app, we rely on the manual "Simulate Success" button 
      // or we could implement auto-success logic here.
      // Let's keep it PENDING unless manually forced in the UI for better control.
      resolve(PaymentStatus.PENDING);
    }, 500);
  });
};

export const paymentService = {
  createWeChatPayOrder,
  checkOrderStatus,
  getConfigStatus: () => ({
    hasAppId: !!WECHAT_CONFIG.appId,
    hasMchId: !!WECHAT_CONFIG.mchId,
  })
};
