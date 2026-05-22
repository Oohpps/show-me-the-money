import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.oohpps.showmethemoney',
  appName: 'Show Me The Money',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#f5f4f2',
  },
};

export default config;
