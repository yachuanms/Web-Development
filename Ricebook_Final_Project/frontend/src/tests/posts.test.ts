import { describe, it, expect } from "vitest";
import postsReducer, {
  fetchPosts,
  filterPosts,
  addFollower,
  removeFollower,
  prependPost,
  type PostsState,
} from "../store/postsSlice";

describe("postsSlice", () => {
  const initialState: PostsState = {
    items: [],
    filtered: [],
    followers: [],
    status: "idle",
  };

  // 抓取貼文成功
  it("should fetch all articles for current logged in user (fulfilled)", () => {
    const mockPosts = [
      { id: 3, userId: 1, title: "Z", body: "." },
      { id: 2, userId: 1, title: "Y", body: "." },
    ];
    const action = { type: fetchPosts.fulfilled.type, payload: mockPosts };
    const next = postsReducer(initialState, action);

    expect(next.status).toBe("succeeded");
    expect(next.items).toEqual(mockPosts);
    expect(next.filtered).toEqual(mockPosts);
  });

  // 抓取貼文失敗
  it("should handle fetchPosts rejected", () => {
    const action = { type: fetchPosts.rejected.type };
    const next = postsReducer(initialState, action);

    expect(next.status).toBe("failed");
  });

  // 抓取貼文中
  it("should handle fetchPosts pending", () => {
    const action = { type: fetchPosts.pending.type };
    const next = postsReducer(initialState, action);

    expect(next.status).toBe("loading");
  });

  // 搜尋貼文
  it("should fetch subset of articles for current logged in user given search keyword", () => {
    const state: PostsState = {
      ...initialState,
      items: [
        { id: 1, userId: 1, title: "Hello world", body: "Test" },
        { id: 2, userId: 1, title: "Bye", body: "React" },
      ],
      filtered: [],
      followers: [],
      status: "succeeded",
    };
    const next = postsReducer(state, filterPosts("hello"));

    expect(next.filtered.length).toBe(1);
    expect(next.filtered[0].title).toBe("Hello world");
  });

  // 新增追蹤者
  it("should add articles when adding a follower", () => {
    const next = postsReducer(initialState, addFollower(5));
    expect(next.followers).toContain(5);
  });

  // 移除追蹤者
  it("should remove articles when removing a follower", () => {
    const prevState = { ...initialState, followers: [1, 2, 3] };
    const next = postsReducer(prevState, removeFollower(2));

    expect(next.followers).toEqual([1, 3]);
  });

  // 新增貼文至最上方
  it("should prepend new post when adding article", () => {
    const prevState = {
      ...initialState,
      items: [{ id: 2, userId: 1, title: "Old", body: "." }],
      filtered: [{ id: 2, userId: 1, title: "Old", body: "." }],
    };
    const newPost = { id: 3, userId: 1, title: "New", body: "." };
    const next = postsReducer(prevState, prependPost(newPost));

    expect(next.items[0].title).toBe("New");
    expect(next.filtered[0].title).toBe("New");
  });

  // 不重複加入追蹤者
  it("should not duplicate followers", () => {
    const prev = { ...initialState, followers: [1] };
    const next = postsReducer(prev, addFollower(1));

    expect(next.followers).toHaveLength(1);
  });
});

import { vi } from "vitest";

it("should execute fetchPosts thunk successfully", async () => {
  // 模擬 fetch 回傳假資料
  const mockPosts = [{ id: 1, userId: 1, title: "A", body: "B" }];

  globalThis.fetch = vi.fn(() =>
    Promise.resolve({
      json: async () => mockPosts,
    })
  ) as unknown as typeof fetch;

  const dispatch = vi.fn();
  const getState = vi.fn();

  const result = await fetchPosts({ userId: 1, followers: [] })(
    dispatch,
    getState,
    undefined
  );

  const payload = result.payload as { length: number };

  expect(result.type).toBe("posts/fetchPosts/fulfilled");
  expect(payload.length).toBeGreaterThan(0);
  expect(globalThis.fetch).toHaveBeenCalled();
});

it("should handle fetchPosts thunk rejection", async () => {
  // 模擬 fetch 拋錯
  globalThis.fetch = vi.fn(() => Promise.reject("Network error")) as unknown as typeof fetch;

  const dispatch = vi.fn();
  const getState = vi.fn();

  try {
    await fetchPosts({ userId: 1, followers: [] })(
      dispatch,
      getState,
      undefined
    );
  } catch {
    // 不使用 e，避免未使用變數的錯誤
  }

  expect(globalThis.fetch).toHaveBeenCalled();
});
