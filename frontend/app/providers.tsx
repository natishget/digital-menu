'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../lib/store/store';
import { useAppDispatch, useAppSelector } from '../lib/store/hooks';
import { setRestaurantSettings } from '../lib/store/slices/themeSlice';
import { api } from '../lib/api';
import { envConfig } from '../lib/config';
import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(envConfig.socketUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socketInstance;
}

function ThemeAndSettingsInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const themeConfig = useAppSelector((state) => state.theme.themeConfig);

  useEffect(() => {
    // 1. Fetch backend settings on startup
    api
      .getSettings()
      .then((settings) => {
        if (settings) {
          dispatch(
            setRestaurantSettings({
              name: settings.name,
              serviceModel: settings.serviceModel,
              themeConfig: settings.themeConfig,
            }),
          );
        }
      })
      .catch((err) => console.log('Backend settings load warning:', err.message));

    // 2. Initialize Socket.IO connection
    getSocket();
  }, [dispatch]);

  // 3. Inject dynamic CSS variables into document :root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', themeConfig?.primaryColor || '#d97706');
      root.style.setProperty('--color-secondary', themeConfig?.secondaryColor || '#78350f');
      root.style.setProperty('--color-accent', themeConfig?.accentColor || '#f59e0b');
      root.style.setProperty('--color-bg', themeConfig?.backgroundColor || '#1c1917');
      root.style.setProperty('--color-surface', themeConfig?.surfaceColor || '#292524');
      root.style.setProperty('--color-text', themeConfig?.textColor || '#fafaf9');
    }
  }, [themeConfig]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeAndSettingsInitializer>{children}</ThemeAndSettingsInitializer>
    </Provider>
  );
}
