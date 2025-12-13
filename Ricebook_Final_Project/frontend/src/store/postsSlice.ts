import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type {PayloadAction} from '@reduxjs/toolkit'

type Article = {
  id: number;
  userId: number;
  title: string;
  body: string;
};

export type PostsState = {
  items: Article[];
  filtered: Article[];
  followers: number[];
  status: "idle" | "loading" | "succeeded" | "failed";
};

const initialState: PostsState = {
  items: [],
  filtered: [],
  followers: [],
  status: "idle",
};

// 抓目前使用者 + 追蹤者的貼文
export const fetchPosts = createAsyncThunk<
  Article[],
  { userId: number; followers: number[] }
>("posts/fetchPosts", async ({ userId, followers }) => {
  const ids = [userId, ...followers];
  const allPosts: Article[] = [];

  for (const id of ids) {
    const res = await fetch(
      `https://jsonplaceholder.typicode.com/users/${id}/posts`
    );
    const data = await res.json();
    allPosts.push(...data);
  }

  return allPosts.sort((a, b) => b.id - a.id);
});

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    filterPosts(state, action: PayloadAction<string>) {
      const key = action.payload.toLowerCase();
      state.filtered = state.items.filter(
        (p) =>
          p.title.toLowerCase().includes(key) ||
          p.body.toLowerCase().includes(key)
      );
    },
    addFollower(state, action: PayloadAction<number>) {
      if (!state.followers.includes(action.payload))
        state.followers.push(action.payload);
    },
    removeFollower(state, action: PayloadAction<number>) {
      state.followers = state.followers.filter((f) => f !== action.payload);
    },
    prependPost(state, action: PayloadAction<Article>) {
      state.items = [action.payload, ...state.items];
      state.filtered = [action.payload, ...state.filtered];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
        state.filtered = action.payload;
      })
      .addCase(fetchPosts.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export const {
  filterPosts,
  addFollower,
  removeFollower,
  prependPost,
} = postsSlice.actions;
export default postsSlice.reducer;
