import React, { useState } from 'react';

interface PaymentModalProps {
  onClose: () => void;
  onPaymentSuccess: (amount: number) => void; // amount of credits purchased
  pricePerCredit: number; // e.g., 0.5 RMB
  disabled: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onPaymentSuccess, pricePerCredit, disabled }) => {
  const [purchaseAmount, setPurchaseAmount] = useState(10); // Default to purchasing 10 credits
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const totalCost = (purchaseAmount * pricePerCredit).toFixed(2); // Format to 2 decimal places

  const handleSimulatePayment = () => {
    setPaymentError(null);
    if (purchaseAmount <= 0) {
      setPaymentError("购买数量必须大于0。");
      return;
    }
    // Simulate a successful payment
    alert(`模拟支付成功！您已支付 ${totalCost} 元，获得 ${purchaseAmount} 积分。`);
    onPaymentSuccess(purchaseAmount);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">积分充值</h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
          aria-label="关闭"
          disabled={disabled}
        >
          &times;
        </button>

        <div className="flex flex-col items-center gap-4">
          <p className="text-lg text-gray-700">当前价格: {pricePerCredit.toFixed(2)} 元/次</p>
          
          <div className="w-full flex items-center justify-center gap-2">
            <label htmlFor="purchase-amount" className="text-gray-700 font-medium">购买数量 (次):</label>
            <input
              type="number"
              id="purchase-amount"
              min="1"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 p-2 border border-gray-300 rounded-md text-center"
              disabled={disabled}
            />
          </div>

          <p className="text-xl font-bold text-blue-600 mt-4">
            总计费用: {totalCost} 元
          </p>

          <div className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded-lg mt-4">
            <p className="text-gray-500 text-center">微信支付二维码占位图</p>
            {/* In a real app, a QR code image from a payment gateway would be displayed here */}
          </div>
          <p className="text-sm text-gray-500 mt-2">（模拟支付，无需真实扫描）</p>

          {paymentError && <p className="text-red-500 text-sm text-center">{paymentError}</p>}

          <button
            onClick={handleSimulatePayment}
            className="w-full py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            disabled={disabled || purchaseAmount <= 0}
          >
            模拟支付成功
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            **重要提示：此为前端模拟支付功能，不涉及真实货币交易。**
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;