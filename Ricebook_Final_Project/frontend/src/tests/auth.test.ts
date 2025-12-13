import { describe, it, expect } from "vitest";
//import authReducer, { login, logout, clearAuth, AuthState } from "../store/authSlice";

import authReducer, { login, logout, clearAuth } from "../store/authSlice";
import type { AuthState } from "../store/authSlice";

describe("authSlice", () => {
  const initialState: AuthState = {
    isLoggedIn: false,
    username: null,
    error: null,
  };

  // 登入成功
  it("should login a previously registered user", () => {
    const action = {
      type: login.fulfilled.type,
      payload: { username: "Bret" },
    };
    const nextState = authReducer(initialState, action);

    expect(nextState.isLoggedIn).toBe(true);
    expect(nextState.username).toBe("Bret");
    expect(nextState.error).toBeNull();
  });

  // 登入失敗：密碼錯誤
  it("should not login an invalid user", () => {
    const action = {
      type: login.rejected.type,
      payload: "Invalid username or password",
    };
    const nextState = authReducer(initialState, action);

    expect(nextState.isLoggedIn).toBe(false);
    expect(nextState.username).toBeNull();
    expect(nextState.error).toBe("Invalid username or password");
  });

  // 登入失敗：使用者不存在
  it("should not login if username not found", () => {
    const action = {
      type: login.rejected.type,
      payload: "Invalid username or password",
    };
    const nextState = authReducer(initialState, action);

    expect(nextState.isLoggedIn).toBe(false);
    expect(nextState.username).toBeNull();
    expect(nextState.error).toBe("Invalid username or password");
  });

  // 登出成功
  it("should logout a user", () => {
    const prevState: AuthState = {
      isLoggedIn: true,
      username: "Bret",
      error: null,
    };
    const action = { type: logout.fulfilled.type };
    const nextState = authReducer(prevState, action);

    expect(nextState.isLoggedIn).toBe(false);
    expect(nextState.username).toBeNull();
    expect(nextState.error).toBeNull();
  });

  // 手動清除登入狀態
  it("should clear auth manually", () => {
    const prevState: AuthState = {
      isLoggedIn: true,
      username: "Bret",
      error: "Error",
    };
    const nextState = authReducer(prevState, clearAuth());

    expect(nextState.isLoggedIn).toBe(false);
    expect(nextState.username).toBeNull();
    expect(nextState.error).toBeNull();
  });

  // 處理登入 pending 狀態
  it("should handle login pending", () => {
    const prevState = {
      isLoggedIn: false,
      username: null,
      error: "Old error",
    };
    const action = { type: login.pending.type };
    const next = authReducer(prevState, action);

    expect(next.error).toBeNull();
    expect(next.isLoggedIn).toBe(false);
  });

  // 處理登入 rejected 狀態
  it("should handle login rejected", () => {
    const prevState = {
      isLoggedIn: false,
      username: null,
      error: null,
    };
    const action = {
      type: login.rejected.type,
      payload: "Invalid username or password",
    };
    const next = authReducer(prevState, action);

    expect(next.isLoggedIn).toBe(false);
    expect(next.username).toBeNull();
    expect(next.error).toBe("Invalid username or password");
  });

  // 處理登出 fulfilled 狀態
  it("should handle logout fulfilled", () => {
    const prevState = {
      isLoggedIn: true,
      username: "Bret",
      error: null,
    };
    const action = { type: logout.fulfilled.type };
    const next = authReducer(prevState, action);

    expect(next.isLoggedIn).toBe(false);
    expect(next.username).toBeNull();
    expect(next.error).toBeNull();
  });
});


import { vi } from "vitest";

// 模擬真實執行 login thunk
it("should execute login thunk successfully (fulfilled)", async () => {
  const dispatch = vi.fn(); 
  const getState = vi.fn();  

  const result = await login({ username: "Bret", password: "Kulas Light" })(
    dispatch,
    getState,
    undefined
  );

  expect(result.type).toBe("auth/login/fulfilled");
  expect(result.payload).toEqual({ username: "Bret" });
});

// 模擬 login 失敗情況
it("should reject login thunk with invalid credentials", async () => {
  const dispatch = vi.fn();  
  const getState = vi.fn();  

  const result = await login({
    username: "Unknown",
    password: "Wrong",
  })(dispatch, getState, undefined);

  expect(result.type).toBe("auth/login/rejected");
  expect(result.payload).toBe("Invalid username or password");
});

// login.rejected 沒有 payload 時，應使用預設錯誤訊息
it("should handle login rejected without payload", () => {
  const prevState = {
    isLoggedIn: false,
    username: null,
    error: null,
  };
  const action = { type: login.rejected.type, payload: undefined };
  const next = authReducer(prevState, action);

  expect(next.error).toBe("Login failed");
});

// logout.fulfilled 再執行一次以覆蓋末端行
it("should clear state correctly when logout fulfilled called again", () => {
  const prevState = {
    isLoggedIn: true,
    username: "Bret",
    error: "Some error",
  };
  const action = { type: logout.fulfilled.type };
  const next = authReducer(prevState, action);

  expect(next.isLoggedIn).toBe(false);
  expect(next.username).toBeNull();
  expect(next.error).toBeNull();
});

// 登入成功後應清除錯誤訊息
it("should clear previous error after successful login", () => {
  const prevState = {
    isLoggedIn: false,
    username: null,
    error: "Old error",
  };
  const action = {
    type: login.fulfilled.type,
    payload: { username: "Bret" },
  };
  const nextState = authReducer(prevState, action);

  expect(nextState.isLoggedIn).toBe(true);
  expect(nextState.username).toBe("Bret");
  expect(nextState.error).toBeNull();
});

