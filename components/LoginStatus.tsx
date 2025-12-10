import React from 'react';
import { User } from '../types';

interface LoginStatusProps {
  currentUser: User | null;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onLogoutClick: () => void;
  onAdminPanelClick: () => void;
}

const LoginStatus: React.FC<LoginStatusProps> = ({
  currentUser,
  onLoginClick,
  onRegisterClick,
  onLogoutClick,
  onAdminPanelClick,
}) => {
  return (
    <div className="p-4 border-b border-gray-200 mb-4 text-center">
      {currentUser ? (
        <div className="flex flex-col items-center">
          <p className="text-gray-800 font-semibold text-lg">
            欢迎, {currentUser.username} {currentUser.isAdmin && <span className="text-purple-600">(管理员)</span>}
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {currentUser.isAdmin && (
              <button
                onClick={onAdminPanelClick}
                className="px-3 py-1 bg-purple-500 text-white rounded-md text-sm hover:bg-purple-600 transition-colors"
              >
                管理面板
              </button>
            )}
            <button
              onClick={onLogoutClick}
              className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <p className="text-gray-600 text-base mb-3">您还未登录。</p>
          <div className="flex gap-2">
            <button
              onClick={onLoginClick}
              className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
            >
              登录
            </button>
            <button
              onClick={onRegisterClick}
              className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
            >
              注册
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginStatus;