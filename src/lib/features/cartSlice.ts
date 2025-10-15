// cartSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Sku {
  id?: string;
  created: string;
  classify1: number;
  classify1_str: string;
  classify2: number;
  classify2_str: string;
  image: string | null;
  name: string;
  price: number;
  product: number;
  product_str: string;
  sku_code: string;
  stock_quantity: number;
  user: number;
}

interface CartItem {
  id: number;
  product_name: string;
  base_price: number;
  sku: Sku;
  sku_list: Sku[];
  quantity: any;
  tax_list: { tax_type: number; amount: number }[];

  price?: number;
  purchase_discount?: number;
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const { id, sku, quantity } = action.payload;
      const itemIndex = state.items.findIndex(
        (item) => item.id === id && ((!item.sku.id && !sku.id) || item.sku.id === sku.id)
      );

      if (itemIndex !== -1) {
        // Chỉ tăng số lượng lên 1 đơn vị
        state.items[itemIndex].quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: quantity });
      }
    },
    updateCart: (
      state,
      action: PayloadAction<{
        id: number;
        skuId?: string | null;
        price?: number;
        tax_list?: Array<{ tax_type: number; amount: number }>;
        purchase_discount?: number;
      }>
    ) => {
      const { id, skuId, price, tax_list, purchase_discount } = action.payload;

      const itemIndex = state.items.findIndex(
        (item) => item.id === id && ((!item.sku.id && !skuId) || item.sku.id === skuId)
      );

      if (itemIndex !== -1) {
        if (price !== undefined) {
          state.items[itemIndex].price = price;
        }
        if (tax_list !== undefined) {
          state.items[itemIndex].tax_list = tax_list;
        }
        if (purchase_discount !== undefined) {
          state.items[itemIndex].purchase_discount = purchase_discount;
        }
      }
    },

    updateQuantity: (state, action: PayloadAction<CartItem>) => {
      const { id, sku, quantity } = action.payload;

      const itemIndex = state.items.findIndex(
        (item) => item.id === id && ((!item.sku.id && !sku.id) || item.sku.id === sku.id)
      );
      if (itemIndex !== -1) {
        state.items[itemIndex].quantity = quantity;
      }
    },

    removeFromCart: (state, action: PayloadAction<{ id: number; skuId?: string | null }>) => {
      state.items = state.items.filter(
        (item) =>
          item.id !== action.payload.id || (item.sku.id !== action.payload.skuId && action.payload.skuId !== null)
      );
    },
    // Add more reducers as per your use case
    decreaseQuantity: (state, action: PayloadAction<{ id: number; skuId?: string }>) => {
      const { id, skuId } = action.payload;
      const itemIndex = state.items.findIndex(
        (item) => item.id === id && ((!item.sku.id && !skuId) || item.sku.id === skuId)
      );

      if (itemIndex !== -1) {
        // If item exists and quantity > 1, decrement quantity
        if (state.items[itemIndex].quantity > 1) {
          state.items[itemIndex].quantity -= 1;
        } else {
          // If quantity === 1, remove item from cart
          state.items.splice(itemIndex, 1);
        }
      }
    },
    changeProductSku: (
      state,
      action: PayloadAction<{
        productId: number;
        newSku: any;
      }>
    ) => {
      const { productId, newSku } = action.payload;
      const itemIndex = state.items.findIndex((item) => item.id === productId);

      if (itemIndex !== -1) {
        state.items[itemIndex].sku = newSku;
      }
    },
    deleteCart: (state) => {
      state.items = []; // Clear all items in the cart
    },
    // resetTax: (state, action: PayloadAction<"taxVAT" | "taxNK" | "taxTTDB">) => {
    //   const resetType = action.payload;
    //   state.items.forEach((item) => {
    //     if (resetType === "taxVAT") {
    //       item.taxVAT = 0;
    //     } else if (resetType === "taxNK") {
    //       item.taxNK = 0;
    //     } else if (resetType === "taxTTDB") {
    //       item.taxTTDB = 0;
    //     }
    //   });
    // },
  },
});

export const {
  addToCart,
  removeFromCart,
  decreaseQuantity,
  changeProductSku,
  deleteCart,
  updateQuantity,
  updateCart,
  // resetTax,
} = cartSlice.actions;
export const selectCart = (state: { cart: CartState }) => state.cart.items;
export default cartSlice.reducer;
