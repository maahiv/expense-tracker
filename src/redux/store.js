import { configureStore } from "@reduxjs/toolkit";

import counterReducer from "./counterReducer";
import expenseReducer from "./expenseReducer";
import authReducer from "./authSlice";

const store = configureStore({
  reducer: {
    counter: counterReducer,
    expenses: expenseReducer,
    auth: authReducer,
  },
});

export default store;