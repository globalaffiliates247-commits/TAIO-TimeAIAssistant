import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'club.taio.timeapp',
  appName: 'TAIO Time',
  webDir: 'out',
  backgroundColor: '#ffffff',
  ios: {
    // Web layer handles safe areas itself via env(safe-area-inset-*)
    contentInset: 'never',
    backgroundColor: '#ffffff',
  },
};

export default config;
