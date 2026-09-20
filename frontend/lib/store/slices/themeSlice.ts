import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Language } from '../../i18n/translations';

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
}

interface ThemeState {
  language: Language;
  isFastingOnly: boolean;
  serviceModel: 'SELF_SERVED' | 'WAITER_ASSISTED';
  venueName: string;
  themeConfig: ThemeConfig;
}

const defaultThemeConfig: ThemeConfig = {
  primaryColor: '#d97706',
  secondaryColor: '#78350f',
  accentColor: '#f59e0b',
  backgroundColor: '#fafaf9',
  surfaceColor: '#ffffff',
  textColor: '#1c1917',
};

const initialState: ThemeState = {
  language: 'en',
  isFastingOnly: false,
  serviceModel: 'SELF_SERVED',
  venueName: 'Abyssinia Coffee & Bistro',
  themeConfig: defaultThemeConfig,
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
    },
    toggleFastingFilter: (state) => {
      state.isFastingOnly = !state.isFastingOnly;
    },
    setFastingFilter: (state, action: PayloadAction<boolean>) => {
      state.isFastingOnly = action.payload;
    },
    setRestaurantSettings: (
      state,
      action: PayloadAction<{
        name?: string;
        serviceModel?: 'SELF_SERVED' | 'WAITER_ASSISTED';
        themeConfig?: Partial<ThemeConfig>;
      }>,
    ) => {
      if (action.payload.name) state.venueName = action.payload.name;
      if (action.payload.serviceModel) state.serviceModel = action.payload.serviceModel;
      if (action.payload.themeConfig) {
        state.themeConfig = {
          ...state.themeConfig,
          ...action.payload.themeConfig,
        };
      }
    },
  },
});

export const { setLanguage, toggleFastingFilter, setFastingFilter, setRestaurantSettings } =
  themeSlice.actions;
export default themeSlice.reducer;
