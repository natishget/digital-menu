import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartModifierOption {
  id: string;
  nameEn: string;
  nameAm?: string;
  priceAdjustment: number;
}

export interface CartItem {
  cartItemId: string; // Unique string for item + specific modifier combination
  menuItemId: string;
  nameEn: string;
  nameAm?: string;
  price: number;
  quantity: number;
  selectedModifiers: CartModifierOption[];
  fulfillmentStation: string;
  imageUrl?: string;
}

interface CartState {
  tableId: string | null;
  tableNumber: number | null;
  qrToken: string | null;
  items: CartItem[];
}

const initialState: CartState = {
  tableId: null,
  tableNumber: null,
  qrToken: null,
  items: [],
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setTableSession: (
      state,
      action: PayloadAction<{ tableId: string; tableNumber: number; qrToken: string }>,
    ) => {
      state.tableId = action.payload.tableId;
      state.tableNumber = action.payload.tableNumber;
      state.qrToken = action.payload.qrToken;
    },
    addToCart: (state, action: PayloadAction<Omit<CartItem, 'cartItemId'>>) => {
      const sortedModIds = action.payload.selectedModifiers
        .map((m) => m.id)
        .sort()
        .join('-');
      const cartItemId = `${action.payload.menuItemId}-${sortedModIds}`;

      const existingIndex = state.items.findIndex((item) => item.cartItemId === cartItemId);
      if (existingIndex > -1) {
        state.items[existingIndex].quantity += action.payload.quantity;
      } else {
        state.items.push({
          ...action.payload,
          cartItemId,
        });
      }
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ cartItemId: string; quantity: number }>,
    ) => {
      const item = state.items.find((i) => i.cartItemId === action.payload.cartItemId);
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter((i) => i.cartItemId !== action.payload.cartItemId);
        } else {
          item.quantity = action.payload.quantity;
        }
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.cartItemId !== action.payload);
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { setTableSession, addToCart, updateQuantity, removeFromCart, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
