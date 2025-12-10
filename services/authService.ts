import { v4 as uuidv4 } from 'uuid';
import { User } from '../types';

const USERS_STORAGE_KEY = 'aiImageEditorUsers';
const CURRENT_USER_STORAGE_KEY = 'aiImageEditorCurrentUser';

// Helper to get all users from localStorage
const getAllUsers = (): User[] => {
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

// Helper to save all users to localStorage
const saveAllUsers = (users: User[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

// Seed initial admin user if not exists
const seedAdminUser = () => {
  const users = getAllUsers();
  if (!users.some(user => user.username === 'admin')) {
    const adminUser: User = {
      id: uuidv4(),
      username: 'admin',
      password: 'admin', // In a real app, this would be hashed
      isAdmin: true,
      credits: 99999, // Admin has unlimited credits
    };
    users.push(adminUser);
    saveAllUsers(users);
  }
};
seedAdminUser(); // Run once on module load

export const authService = {
  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },

  login: async (username: string, password: string): Promise<User | null> => {
    const users = getAllUsers();
    const user = users.find(u => u.username === username && u.password === password); // In real app, compare hashed passwords
    if (user) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  register: async (username: string, password: string): Promise<User | null> => {
    const users = getAllUsers();
    if (users.some(u => u.username === username)) {
      return null; // Username already exists
    }
    const newUser: User = {
      id: uuidv4(),
      username,
      password, // In a real app, this would be hashed
      isAdmin: false,
      credits: 3, // Default 3 free credits for new users
    };
    users.push(newUser);
    saveAllUsers(users);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(newUser)); // Log in new user automatically
    return newUser;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  },

  updateUserCredits: async (userId: string, newCredits: number): Promise<void> => {
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].credits = newCredits;
      saveAllUsers(users);
      // If the updated user is the current logged-in user, update localStorage for current user too
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(users[userIndex]));
      }
    }
  },

  getUserCredits: async (userId: string): Promise<number | null> => {
    const users = getAllUsers();
    const user = users.find(u => u.id === userId);
    return user ? user.credits : null;
  },

  getAllUsers: (): User[] => {
    return getAllUsers();
  },

  deleteUser: (userId: string): void => {
    let users = getAllUsers();
    users = users.filter(user => user.id !== userId);
    saveAllUsers(users);
    // If deleted user was current user, log out
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      authService.logout();
    }
  },

  // Admin function to update any user
  adminUpdateUser: (updatedUser: User): void => {
    let users = getAllUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser; // Update entire user object
      saveAllUsers(users);
      // If the updated user is the current logged-in user, refresh their session
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.id === updatedUser.id) {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updatedUser));
      }
    }
  }
};