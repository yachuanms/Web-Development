// src/store/authSlice.ts
//登入 登出 驗證登入
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type {PayloadAction} from '@reduxjs/toolkit'

export type AuthState = {
  isLoggedIn: boolean;
  username: string | null;
  error: string | null;
};

const initialState: AuthState = {
  isLoggedIn: false,
  username: null,
  error: null,
};

// 登入 模擬從 JSONPlaceholder 抓使用者資料
export const login = createAsyncThunk<
  { username: string },
  { username: string; password: string }
>(
  "auth/login",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      // 用 username 找出使用者
      const res = await fetch(
        `https://jsonplaceholder.typicode.com/users?username=${encodeURIComponent(
          username
        )}`
      );
      const users = await res.json();

      if (!Array.isArray(users) || users.length === 0)
        return rejectWithValue("Invalid username or password");

      const user = users[0];
      if (user.address?.street !== password)
        return rejectWithValue("Invalid username or password");

      // 登入成功
      return { username: user.username };
    } catch {
      return rejectWithValue("Network error");
    }
  }
);

// 登出
export const logout = createAsyncThunk("auth/logout", async () => {
  return true;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoggedInUser(state, action: PayloadAction<string>) {
      state.isLoggedIn = true;
      state.username = action.payload;
      state.error = null;
    },
    clearAuth(state) {
      state.isLoggedIn = false;
      state.username = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoggedIn = true;
        state.username = action.payload.username;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoggedIn = false;
        state.username = null;
        state.error = (action.payload as string) ?? "Login failed";
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoggedIn = false;
        state.username = null;
        state.error = null;
      });
  },
});

export const { setLoggedInUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
