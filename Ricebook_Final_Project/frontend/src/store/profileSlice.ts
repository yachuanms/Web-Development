// src/store/profileSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type {PayloadAction} from '@reduxjs/toolkit'

export type ProfileState = {
  username: string | null;
  headline: string;
  email: string;
  phone: string;
  zipcode: string;
};

const initialState: ProfileState = {
  username: null,
  headline: "I'm learning React!",
  email: "abc@example.com",
  phone: "123-456-7890",
  zipcode: "77005",
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    // 從登入狀態設定 username
    setUsername(state, action: PayloadAction<string>) {
      state.username = action.payload;
    },
    // 更新 headline（個人狀態訊息）
    updateHeadline(state, action: PayloadAction<string>) {
      state.headline = action.payload;
    },
    // 更新其他個資（非持久化）
    updateProfileInfo(
      state,
      action: PayloadAction<{ email: string; phone: string; zipcode: string }>
    ) {
      state.email = action.payload.email;
      state.phone = action.payload.phone;
      state.zipcode = action.payload.zipcode;
    },
  },
});

export const { setUsername, updateHeadline, updateProfileInfo } =
  profileSlice.actions;

export default profileSlice.reducer;
