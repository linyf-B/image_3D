import React, { useState, FormEvent } from 'react';
import { User } from '../types';

interface AuthModalProps {
  mode: 'login' | 'register';
  onClose: () => void;
  onLogin: (username: string, password: string) => Promise<boolean>;
  onRegister: (username: string, password: string) => Promise<boolean>;
  disabled: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose, onLogin, onRegister, disabled }) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);

    if (!username.trim() || !password.trim()) {
      setAuthError("用户名和密码不能为空。");
      setIsAuthenticating(false);
      return;
    }

    if (currentMode === 'register' && password !== confirmPassword) {
      setAuthError("两次输入的密码不一致。");
      setIsAuthenticating(false);
      return;
    }

    let success = false;
    if (currentMode === 'login') {
      success = await onLogin(username, password);
      if (!success) {
        setAuthError("登录失败，请检查用户名或密码。");
      }
    } else { // register
      success = await onRegister(username, password);
      if (!success) {
        setAuthError("注册失败，用户名可能已被占用。");
      }
    }
    setIsAuthenticating(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {currentMode === 'login' ? '用户登录' : '用户注册'}
        </h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
          aria-label="关闭"
          disabled={disabled || isAuthenticating}
        >
          &times;
        </button>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              用户名:
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              disabled={disabled || isAuthenticating}
              required
              aria-required="true"
              placeholder="请输入用户名"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              密码:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              disabled={disabled || isAuthenticating}
              required
              aria-required="true"
              placeholder="请输入密码"
            />
          </div>
          {currentMode === 'register' && (
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                确认密码:
              </label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                disabled={disabled || isAuthenticating}
                required
                aria-required="true"
                placeholder="请再次输入密码"
              />
            </div>
          )}

          {authError && <p className="text-red-500 text-sm text-center">{authError}</p>}

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            disabled={disabled || isAuthenticating}
          >
            {isAuthenticating ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {currentMode === 'login' ? '登录中...' : '注册中...'}
              </span>
            ) : (
              currentMode === 'login' ? '登录' : '注册'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          {currentMode === 'login' ? (
            <>
              还没有账户？{' '}
              <button
                type="button"
                onClick={() => setCurrentMode('register')}
                className="text-blue-600 hover:text-blue-800 font-medium"
                disabled={disabled || isAuthenticating}
              >
                立即注册
              </button>
            </>
          ) : (
            <>
              已有账户？{' '}
              <button
                type="button"
                onClick={() => setCurrentMode('login')}
                className="text-blue-600 hover:text-blue-800 font-medium"
                disabled={disabled || isAuthenticating}
              >
                前往登录
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default AuthModal;