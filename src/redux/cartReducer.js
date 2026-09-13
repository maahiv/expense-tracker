import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import { auth, databaseURL } from "../firebase";

// Fetch cart data from Firebase when page reloads
export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (_, { rejectWithValue }) => {
    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Please login again.");
      }

      const idToken = await user.getIdToken(true);

      const response = await fetch(
        `${databaseURL}/cart/${user.uid}.json?auth=${idToken}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to load cart items."
        );
      }

      if (!data) {
        return [];
      }

      const cartArray = Object.entries(data).map(
        ([id, item]) => ({
          id,
          amount: item.amount,
          description: item.description,
          category: item.category,
          quantity: Number(item.quantity) || 1,
        })
      );

      return cartArray;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to load cart items."
      );
    }
  }
);


// Send cart data to Firebase using createAsyncThunk
export const sendCartData = createAsyncThunk(
  "cart/sendCartData",
  async (cart, { rejectWithValue }) => {
    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Please login again.");
      }

      const idToken = await user.getIdToken(true);

      const cartData = {};

      cart.forEach((item) => {
        cartData[item.id] = {
          amount: item.amount,
          description: item.description,
          category: item.category,
          quantity: item.quantity,
        };
      });

      const response = await fetch(
        `${databaseURL}/cart/${user.uid}.json?auth=${idToken}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cartData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to send cart data."
        );
      }

      return cart;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to send cart data."
      );
    }
  }
);


const cartSlice = createSlice({
  name: "cart",

  initialState: [],

  reducers: {
    // Set cart after fetching from Firebase
    setCart(state, action) {
      return action.payload;
    },

    // Add item to cart
    addToCart(state, action) {
      const product = action.payload;

      const existingProduct = state.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        existingProduct.quantity += 1;
      } else {
        state.push({
          ...product,
          quantity: 1,
        });
      }
    },

    // Increase quantity
    increaseQuantity(state, action) {
      const item = state.find(
        (item) => item.id === action.payload
      );

      if (item) {
        item.quantity += 1;
      }
    },

    // Decrease quantity
    // Remove item when quantity becomes 0
    decreaseQuantity(state, action) {
      const item = state.find(
        (item) => item.id === action.payload
      );

      if (item) {
        item.quantity -= 1;
      }

      return state.filter(
        (item) => item.quantity > 0
      );
    },

    // Remove complete item
    removeFromCart(state, action) {
      return state.filter(
        (item) => item.id !== action.payload
      );
    },
  },


  // Handle async thunk states
  extraReducers: (builder) => {
    builder

      // Sending data
      .addCase(sendCartData.pending, () => {
        console.log("Sending cart data...");
      })

      // Data sent successfully
      .addCase(sendCartData.fulfilled, () => {
        console.log("Cart data sent successfully.");
      })

      // Error while sending data
      .addCase(
        sendCartData.rejected,
        (state, action) => {
          console.error(
            "Failed to send cart data:",
            action.payload
          );
        }
      );
  },
});


export const {
  setCart,
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
} = cartSlice.actions;

export default cartSlice.reducer;