import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./counterReducer";
import expenseReducer from "./expenseReducer";
import authReducer from "./authSlice";
import themeReducer from "./themeReducer";
import cartReducer from "./cartReducer";

const store = configureStore({
  reducer: {
    counter: counterReducer,
    expenses: expenseReducer,
    auth: authReducer,
    theme: themeReducer,
    cart: cartReducer,
  },
});

export default store;