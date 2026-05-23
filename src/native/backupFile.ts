import { Capacitor, registerPlugin } from '@capacitor/core';

interface BackupFilePlugin {
  saveJson(options: { fileName: string; content: string }): Promise<{ uri: string }>;
}

const BackupFile = registerPlugin<BackupFilePlugin>('BackupFile');

export async function saveBackupJsonFile(fileName: string, content: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    await BackupFile.saveJson({ fileName, content });
    return true;
  } catch {
    return false;
  }
}
