import React, { useState, useEffect } from 'react';
import { User, PaymentConfig } from '../types';
import { adminService } from '../services/adminService';

interface AdminPanelProps {
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onConfigUpdate: (config: PaymentConfig) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, currentUser, onUpdateUser, onDeleteUser, onConfigUpdate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(adminService.getPaymentConfig());
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editCredits, setEditCredits] = useState<number>(0);
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser.isAdmin) {
      setUsers(adminService.getAllUsers());
      setPaymentConfig(adminService.getPaymentConfig());
    }
  }, [currentUser]);

  const handleEditCredits = (user: User) => {
    setEditUserId(user.id);
    setEditCredits(user.credits);
    setAdminError(null);
  };

  const handleSaveCredits = (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (userToUpdate) {
      if (editCredits < 0) {
        setAdminError("积分不能为负数。");
        return;
      }
      const updatedUser: User = { ...userToUpdate, credits: editCredits };
      adminService.updateUser(updatedUser);
      setUsers(adminService.getAllUsers()); // Refresh user list
      onUpdateUser(updatedUser); // Notify parent App.tsx
      setEditUserId(null);
    }
  };

  const handleDeleteUser = (userId: string, username: string) => {
    if (userId === currentUser.id) {
      setAdminError("管理员不能删除自己！");
      return;
    }
    if (window.confirm(`确定要删除用户 "${username}" 吗？此操作不可逆。`)) {
      adminService.deleteUser(userId);
      setUsers(adminService.getAllUsers()); // Refresh user list
      onDeleteUser(userId); // Notify parent App.tsx
      setAdminError(null);
    }
  };

  const handleSavePaymentConfig = () => {
    if (paymentConfig.pricePerCredit <= 0 || paymentConfig.initialFreeCredits < 0) {
      setAdminError("价格和初始积分必须是非负数，价格需大于0。");
      return;
    }
    adminService.updatePaymentConfig(paymentConfig);
    onConfigUpdate(paymentConfig); // Notify parent immediately
    setAdminError(null);
    alert("支付配置已更新！"); // Visual feedback
  };

  if (!currentUser.isAdmin) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl p-6 relative w-full max-w-lg text-center">
          <p className="text-red-600 font-bold text-xl">无权限访问！</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md">关闭</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl relative">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">管理员面板</h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
          aria-label="关闭"
        >
          &times;
        </button>

        {adminError && <p className="text-red-500 text-sm text-center mb-4">{adminError}</p>}

        {/* 用户管理 */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">用户管理</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600">用户名</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600">身份</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600">积分</th>
                  <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-600">调用次数</th>
                  <th className="py-2 px-4 border-b text-center text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 text-sm text-gray-800">{user.username}</td>
                    <td className="py-2 px-4 text-sm text-gray-800">{user.isAdmin ? '管理员' : '普通用户'}</td>
                    <td className="py-2 px-4 text-sm text-gray-800">
                      {editUserId === user.id ? (
                        <input
                          type="number"
                          value={editCredits}
                          onChange={(e) => setEditCredits(parseInt(e.target.value) || 0)}
                          className="w-20 p-1 border rounded-md text-sm"
                        />
                      ) : (
                        user.credits
                      )}
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-800">{user.usageCount || 0}</td>
                    <td className="py-2 px-4 text-center">
                      {editUserId === user.id ? (
                        <button
                          onClick={() => handleSaveCredits(user.id)}
                          className="text-green-600 hover:text-green-800 text-sm mr-2"
                        >
                          保存
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditCredits(user)}
                          className="text-blue-600 hover:text-blue-800 text-sm mr-2"
                        >
                          编辑积分
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        disabled={user.id === currentUser.id} // Prevent admin from deleting self
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 支付配置管理 */}
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">支付配置 (模拟)</h3>
          <div className="flex flex-col gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div>
              <label htmlFor="price-per-credit" className="block text-sm font-medium text-gray-700 mb-1">
                每积分价格 (元):
              </label>
              <input
                type="number"
                id="price-per-credit"
                step="0.1"
                min="0.01"
                value={paymentConfig.pricePerCredit}
                onChange={(e) => setPaymentConfig({ ...paymentConfig, pricePerCredit: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="initial-free-credits" className="block text-sm font-medium text-gray-700 mb-1">
                新用户初始免费积分:
              </label>
              <input
                type="number"
                id="initial-free-credits"
                min="0"
                value={paymentConfig.initialFreeCredits}
                onChange={(e) => setPaymentConfig({ ...paymentConfig, initialFreeCredits: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSavePaymentConfig}
              className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mt-2"
            >
              保存支付配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;