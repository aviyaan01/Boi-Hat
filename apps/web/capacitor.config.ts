import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.boihat.app',
  appName: 'Boi-Hat',
  webDir: 'public',
  server: {
    // Live Deployed URL (replace with your Vercel/Railway URL when deployed):
    // url: 'https://boi-hat.vercel.app',
    
    // Local Wi-Fi testing (runs directly from your PC to your phone on the same Wi-Fi):
    url: 'http://192.168.0.106:3000',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
