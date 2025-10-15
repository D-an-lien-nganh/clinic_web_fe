import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: false,
  reducers: {
    setIsAuth: (state, action) => {
      return action.payload;
    },
  },
});

export const { setIsAuth } = authSlice.actions;
export default authSlice.reducer;
