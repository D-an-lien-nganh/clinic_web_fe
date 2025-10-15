import { createSlice } from "@reduxjs/toolkit";

export const searchParamsSlice = createSlice({
  name: "searchParams",
  initialState: "",
  reducers: {
    updateSearchParams: (state, action) => action.payload,
  },
});

export const { updateSearchParams } = searchParamsSlice.actions;

export default searchParamsSlice.reducer;
