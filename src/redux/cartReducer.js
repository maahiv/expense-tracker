import { createAsyncThunk } from "@reduxjs/toolkit";
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


// Save cart data to Firebase
export const saveCart = createAsyncThunk(
  "cart/saveCart",
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
          data?.error || "Failed to save cart."
        );
      }

      return cart;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to save cart."
      );
    }
  }
);


const cartReducer = (state = [], action) => {
  switch (action.type) {

    // Set cart after getting data from Firebase
    case "SET_CART":
      return action.payload;


    // Add item to cart
    case "ADD_TO_CART": {
      const product = action.payload;

      const existingProduct = state.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        return state.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...state,
        {
          ...product,
          quantity: 1,
        },
      ];
    }


    // Increase quantity
    case "INCREASE_QUANTITY":
      return state.map((item) =>
        item.id === action.payload
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      );


    // Decrease quantity
    // If quantity becomes 0, remove item
    case "DECREASE_QUANTITY":
      return state
        .map((item) =>
          item.id === action.payload
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0);


    // Remove complete item
    case "REMOVE_FROM_CART":
      return state.filter(
        (item) => item.id !== action.payload
      );


    default:
      return state;
  }
};

export default cartReducer;