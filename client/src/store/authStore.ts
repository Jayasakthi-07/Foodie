import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../utils/api';
import { useCartStore } from './cartStore';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin' | 'restaurant_manager';
  wallet: number;
  addresses: any[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // Clear cart when logging in (to prevent seeing previous user's cart)
          useCartStore.getState().clearCart();
          
          const response = await api.post('/auth/login', { email, password });
          const { user, accessToken } = response.data.data;
          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (name: string, email: string, password: string, phone?: string) => {
        set({ isLoading: true });
        try {
          // Clear cart when registering (to prevent seeing previous user's cart)
          useCartStore.getState().clearCart();
          
          const response = await api.post('/auth/register', { name, email, password, phone });
          const { user, accessToken } = response.data.data;
          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear cart when logging out
          useCartStore.getState().clearCart();
          
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
        }
      },

      checkAuth: async () => {
        const { accessToken, user: currentUser } = get();
        if (!accessToken) {
          set({ isAuthenticated: false, user: null });
          // Clear cart if not authenticated
          useCartStore.getState().clearCart();
          return;
        }

        try {
          const response = await api.get('/auth/me');
          const newUser = response.data.data.user;
          
          // If user changed (different user logged in), clear cart
          if (currentUser && currentUser._id !== newUser._id) {
            useCartStore.getState().clearCart();
          }
          
          set({
            user: newUser,
            isAuthenticated: true,
          });
        } catch (error) {
          // Clear cart on auth failure
          useCartStore.getState().clearCart();
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

