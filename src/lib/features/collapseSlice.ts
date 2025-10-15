import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface collapseState {
  isCollapse: boolean;
}

const initialState: collapseState = {
  isCollapse: false,
};

export const collapseSlice = createSlice({
  name: "sideCollapse",
  initialState,
  reducers: {
    setIsCollapse: (state, action: PayloadAction<boolean>) => {
      state.isCollapse = action.payload;
    },
  },
});

export const { setIsCollapse } = collapseSlice.actions;
export default collapseSlice.reducer;
