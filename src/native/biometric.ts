import { Capacitor, registerPlugin } from '@capacitor/core';

interface BiometricAuthPlugin {
  authenticate(options: { title: string; subtitle: string; negativeButtonText: string }): Promise<{ verified: boolean }>;
}

const BiometricAuth = registerPlugin<BiometricAuthPlugin>('BiometricAuth');

export async function authenticateApp(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return true;
  }

  try {
    const result = await BiometricAuth.authenticate({
      title: '验证身份',
      subtitle: '使用系统指纹认证进入应用',
      negativeButtonText: '取消',
    });

    return result.verified;
  } catch {
    return false;
  }
}
