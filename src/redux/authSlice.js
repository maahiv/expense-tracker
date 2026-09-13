import { createSlice } from "@reduxjs/toolkit";

const savedToken = localStorage.getItem("expenseTrackerToken");
const savedUserId = localStorage.getItem("expenseTrackerUserId");

const authSlice = createSlice({
  name: "auth",

  initialState: {
    isAuthenticated: !!savedToken,
    token: savedToken || null,
    userId: savedUserId || null,
  },

  reducers: {
    login(state, action) {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.userId = action.payload.userId;

      localStorage.setItem("expenseTrackerToken", action.payload.token);
      localStorage.setItem("expenseTrackerUserId", action.payload.userId);
    },

    logout(state) {
      state.isAuthenticated = false;
      state.token = null;
      state.userId = null;

      localStorage.removeItem("expenseTrackerToken");
      localStorage.removeItem("expenseTrackerUserId");
    },
  },
});

export const { login, logout } = authSlice.actions;

export default authSlice.reducer;