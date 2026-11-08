import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig & { packageClassList?: string[] } = {
  appId: 'club.taio.timeapp',
  appName: 'TAIO Time',
  webDir: 'out',
  backgroundColor: '#ffffff',
  packageClassList: ['TAIONativePlugin'],
  ios: {
    // Web layer + AppShell handle safe areas via --sat / --sab
    contentInset: 'never',
    backgroundColor: '#ffffff',
  },
};

export default config;
