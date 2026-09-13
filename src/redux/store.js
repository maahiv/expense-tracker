import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./counterReducer";
import expenseReducer from "./expenseReducer";
import authReducer from "./authSlice";
import themeReducer from "./themeReducer";

const store = configureStore({
  reducer: {
    counter: counterReducer,
    expenses: expenseReducer,
    auth: authReducer,
    theme: themeReducer,
  },
});

export default store;