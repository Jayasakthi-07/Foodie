import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  dish: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  addOns: { name: string; price: number }[];
  restaurant: string;
  restaurantName?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getItemsByRestaurant: () => Record<string, CartItem[]>;
  getRestaurants: () => string[];
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: CartItem) => {
        const { items } = get();

        // Find existing item with same dish and add-ons
        const existingItem = items.find((i) => i.dish === item.dish && 
          JSON.stringify(i.addOns) === JSON.stringify(item.addOns));

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.dish === item.dish && JSON.stringify(i.addOns) === JSON.stringify(item.addOns)
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({
            items: [...items, item],
          });
        }
      },

      removeItem: (dishId: string) => {
        const { items } = get();
        const filtered = items.filter((item) => item.dish !== dishId);
        
        set({
          items: filtered,
        });
      },

      updateQuantity: (dishId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(dishId);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.dish === dishId ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const itemSubtotal = item.price * item.quantity;
          const addOnsTotal = item.addOns.reduce((addSum, addon) => addSum + addon.price, 0) * item.quantity;
          return sum + itemSubtotal + addOnsTotal;
        }, 0);
      },

      getItemsByRestaurant: () => {
        const { items } = get();
        const grouped: Record<string, CartItem[]> = {};
        items.forEach((item) => {
          if (!grouped[item.restaurant]) {
            grouped[item.restaurant] = [];
          }
          grouped[item.restaurant].push(item);
        });
        return grouped;
      },

      getRestaurants: () => {
        const { items } = get();
        const restaurantIds = new Set(items.map((item) => item.restaurant));
        return Array.from(restaurantIds);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

