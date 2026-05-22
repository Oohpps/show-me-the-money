import { App, type PluginListenerHandle } from '@capacitor/app';
import { onMounted, onUnmounted } from 'vue';

interface NativeBackStackOptions {
  canGoBack: () => boolean;
  goBack: () => void;
}

export function useNativeBackStack(options: NativeBackStackOptions) {
  let appListener: PluginListenerHandle | null = null;

  const onPopState = () => {
    if (options.canGoBack()) {
      options.goBack();
    }
  };

  const pushLayer = (name: string) => {
    window.history.pushState(
      {
        ...(window.history.state ?? {}),
        appLayer: name,
        appLayerAt: Date.now(),
      },
      '',
      window.location.href,
    );
  };

  const requestBack = () => {
    if (options.canGoBack()) {
      window.history.back();
    }
  };

  onMounted(async () => {
    window.addEventListener('popstate', onPopState);

    try {
      appListener = await App.addListener('backButton', ({ canGoBack }) => {
        if (options.canGoBack() || canGoBack) {
          window.history.back();
          return;
        }

        App.exitApp();
      });
    } catch (error) {
      console.warn('Capacitor App 插件不可用，可能在非 App 环境下运行', error);
    }
  });

  onUnmounted(() => {
    window.removeEventListener('popstate', onPopState);
    appListener?.remove();
    appListener = null;
  });

  return {
    pushLayer,
    requestBack,
  };
}
