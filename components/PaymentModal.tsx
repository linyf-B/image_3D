import React, { useState, useEffect } from 'react';
import { paymentService } from '../services/paymentService';
import { PaymentOrder } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface PaymentModalProps {
  onClose: () => void;
  onPaymentSuccess: (amount: number) => void; // amount of credits purchased
  pricePerCredit: number; // e.g., 0.5 RMB
  disabled: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onPaymentSuccess, pricePerCredit, disabled }) => {
  const [purchaseAmount, setPurchaseAmount] = useState(10); // Default to purchasing 10 credits
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const totalCost = (purchaseAmount * pricePerCredit).toFixed(2); // Format to 2 decimal places

  // Reset order when purchase amount changes
  useEffect(() => {
    setOrder(null);
    setPaymentError(null);
  }, [purchaseAmount]);

  const handleCreateOrder = async () => {
    if (purchaseAmount <= 0) {
      setPaymentError("购买数量必须大于0。");
      return;
    }
    setIsLoadingOrder(true);
    setPaymentError(null);
    try {
      // Call the service to get the payment code_url
      const newOrder = await paymentService.createWeChatPayOrder(parseFloat(totalCost), purchaseAmount);
      setOrder(newOrder);
    } catch (e) {
      setPaymentError("创建订单失败，请稍后重试。");
    } finally {
      setIsLoadingOrder(false);
    }
  };

  const handleSimulatePaymentSuccess = () => {
    if (!order) return;
    alert(`模拟微信支付回调成功！\n订单号: ${order.orderId}\n金额: ${order.amount} 元`);
    onPaymentSuccess(purchaseAmount);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          <span className="flex items-center justify-center gap-2">
            <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8.252 14.819c-.105.074-.187.195-.126.315.068.136.216.096.315.035.858-.535 2.126-1.126 3.843-.72.099.023.218-.035.253-.133.036-.1.082-.24-.047-.354-.627-.552-2.317-1.428-4.238.857zm6.756 1.488c-.105.074-.187.195-.126.315.068.136.216.096.315.035.858-.535 2.126-1.126 3.843-.72.099.023.218-.035.253-.133.036-.1.082-.24-.047-.354-.627-.552-2.317-1.428-4.238.857zM24 10.5c0-4.088-4.08-7.5-9.282-7.5-5.268 0-9.467 3.412-9.467 7.5 0 2.213 1.22 4.218 3.197 5.617l-.768 2.684 2.85-1.42c1.233.398 2.62.619 4.188.619 5.202 0 9.282-3.412 9.282-7.5zm-14.862 8.7c0 3.255-3.328 5.867-7.29 5.867-1.25 0-2.355-.262-3.336-.58l-2.27 1.13.612-2.136C-1.077 22.366 0 20.77 0 19.2c0-3.256 3.328-5.868 7.29-5.868.214 0 .425.01.632.023C7.574 14.398 7.29 15.54 7.29 16.71c0 4.103 4.417 7.432 9.88 7.432 1.343 0 2.617-.205 3.79-.58-.707.973-2.115 1.638-3.822 1.638z"/></svg>
            微信支付充值
          </span>
        </h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
          aria-label="关闭"
          disabled={disabled}
        >
          &times;
        </button>

        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-700">当前单价: {pricePerCredit.toFixed(2)} 元/积分</p>
          
          <div className="w-full flex items-center justify-center gap-2">
            <label htmlFor="purchase-amount" className="text-gray-700 font-medium">购买积分数:</label>
            <input
              type="number"
              id="purchase-amount"
              min="1"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 p-2 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-green-500 focus:outline-none"
              disabled={disabled || isLoadingOrder || !!order}
            />
          </div>

          <p className="text-2xl font-bold text-green-600">
            ¥ {totalCost}
          </p>

          {!order ? (
            <button
              onClick={handleCreateOrder}
              className="w-full py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium text-lg disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={disabled || purchaseAmount <= 0 || isLoadingOrder}
            >
              {isLoadingOrder ? <LoadingSpinner /> : '立即支付'}
            </button>
          ) : (
            <div className="flex flex-col items-center w-full animate-fade-in">
              <div className="bg-white p-2 border-2 border-green-100 rounded-lg shadow-inner">
                {/* 
                  Using a QR code generation API for visualization.
                  In a real app, this data would come from the 'code_url' returned by WeChat API.
                */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(order.codeUrl)}&color=000000&bgcolor=ffffff`}
                  alt="微信支付二维码"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm text-gray-500 mt-3 animate-pulse">请使用微信扫一扫支付</p>
              
              <div className="mt-4 w-full p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700 text-left">
                <p className="font-bold mb-1">开发调试模式:</p>
                <p>因无真实后端回调，请点击下方按钮模拟支付成功。</p>
              </div>

              <button
                onClick={handleSimulatePaymentSuccess}
                className="w-full mt-2 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                (模拟) 支付成功回调
              </button>
              
              <button
                onClick={() => setOrder(null)}
                className="mt-2 text-gray-400 hover:text-gray-600 text-sm underline"
              >
                取消订单 / 重新选择
              </button>
            </div>
          )}

          {paymentError && <p className="text-red-500 text-sm text-center">{paymentError}</p>}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
