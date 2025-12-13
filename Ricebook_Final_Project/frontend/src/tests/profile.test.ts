import { describe, it, expect } from "vitest";
import profileReducer, {
  setUsername,
  updateHeadline,
  updateProfileInfo,
} from "../store/profileSlice";
import type { ProfileState } from "../store/profileSlice";

describe("profileSlice", () => {
  const initialState: ProfileState = {
    username: null,
    headline: "I'm learning React!",
    email: "abc@example.com",
    phone: "123-456-7890",
    zipcode: "77005",
  };

  // 抓取使用者名稱
  it("should fetch the logged in user's profile username", () => {
    const action = setUsername("Bret");
    const nextState = profileReducer(initialState, action);

    expect(nextState.username).toBe("Bret");
  });

  // 更新狀態訊息
  it("should update the headline message", () => {
    const action = updateHeadline("Hello world!");
    const nextState = profileReducer(initialState, action);

    expect(nextState.headline).toBe("Hello world!");
  });

  // 更新個資
  it("should update the profile contact information", () => {
    const action = updateProfileInfo({
      email: "new@example.com",
      phone: "999-888-7777",
      zipcode: "77001",
    });
    const nextState = profileReducer(initialState, action);

    expect(nextState.email).toBe("new@example.com");
    expect(nextState.phone).toBe("999-888-7777");
    expect(nextState.zipcode).toBe("77001");
  });
});
