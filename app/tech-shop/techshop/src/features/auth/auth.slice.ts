import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { User } from "./auth.api";
import { getMe, logoutRequest } from "./auth.api";

type AuthState = {
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  user: User | null;
  error?: string;
};

const initialState: AuthState = {
  status: "idle",
  user: null,
};

export const fetchMe = createAsyncThunk<User>(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getMe();
      
      localStorage.setItem("is_login_success","true");
      return data;
    } catch (e: unknown) {
      // 401 => chưa login
      const is_login_success = localStorage.getItem("is_login_success")
      if (is_login_success != null && JSON.parse(is_login_success)) {
        window.location.href = "http://localhost:8088/oauth2/authorization/admin-idp";
      }
      localStorage.setItem("is_login_success","false");
      return rejectWithValue(e);
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await logoutRequest();
  return true;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUnauthenticated(state) {
      state.status = "unauthenticated";
      state.user = null;
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.user = null;
        state.error = String(action.payload ?? "UNAUTHENTICATED");
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = "unauthenticated";
        state.user = null;
        state.error = undefined;
      });
  },
});

export const { setUnauthenticated } = authSlice.actions;
export default authSlice.reducer;
