import { configureStore } from "@reduxjs/toolkit";

import counterReducer from "./counterReducer";
import expenseReducer from "./expenseReducer";

const store = configureStore({
  reducer: {
    counter: counterReducer,
    expenses: expenseReducer,
  },
});

export default store;