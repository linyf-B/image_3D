import { User, PaymentConfig } from '../types';
import { authService } from './authService';

const PAYMENT_CONFIG_STORAGE_KEY = 'aiImageEditorPaymentConfig';

// Default payment configuration
const defaultPaymentConfig: PaymentConfig = {
  pricePerCredit: 0.5, // 0.5 RMB per use
  initialFreeCredits: 3,
};

// Seed default payment config if not exists
const getPaymentConfig = (): PaymentConfig => {
  const configJson = localStorage.getItem(PAYMENT_CONFIG_STORAGE_KEY);
  if (configJson) {
    return JSON.parse(configJson);
  }
  localStorage.setItem(PAYMENT_CONFIG_STORAGE_KEY, JSON.stringify(defaultPaymentConfig));
  return defaultPaymentConfig;
};
getPaymentConfig(); // Initialize on module load

export const adminService = {
  // User Management
  getAllUsers: (): User[] => {
    return authService.getAllUsers();
  },

  updateUser: (updatedUser: User): void => {
    authService.adminUpdateUser(updatedUser);
  },

  deleteUser: (userId: string): void => {
    authService.deleteUser(userId);
  },

  // Payment Configuration Management (Simulated)
  getPaymentConfig: (): PaymentConfig => {
    return getPaymentConfig();
  },

  updatePaymentConfig: (newConfig: PaymentConfig): void => {
    localStorage.setItem(PAYMENT_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
  },
};