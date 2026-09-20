import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  activeWaiterTableId: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  activeWaiterTableId: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken: string;
        tableId?: string;
      }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      if (action.payload.tableId) {
        state.activeWaiterTableId = action.payload.tableId;
      }
    },
    setActiveWaiterTable: (state, action: PayloadAction<string | null>) => {
      state.activeWaiterTableId = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.activeWaiterTableId = null;
    },
  },
});

export const { setCredentials, setActiveWaiterTable, logout } = authSlice.actions;
export default authSlice.reducer;
