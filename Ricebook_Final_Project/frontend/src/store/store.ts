// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import postsReducer from "./postsSlice";
import profileReducer from "./profileSlice";

// Redux 的中央 store：把三個 slice 全部連接起來
export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
    profile: profileReducer,
  },
});

// 型別定義（之後寫測試或 hook 時會用到）
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
