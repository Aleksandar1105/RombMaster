import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const Native = {
  async init() {
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0f172a' });
    } catch (e) { console.log('Web environment'); }
  },

  async vibrate(type = 'light') {
    try {
      if (type === 'heavy') await Haptics.impact({ style: ImpactStyle.Heavy });
      else if (type === 'medium') await Haptics.impact({ style: ImpactStyle.Medium });
      else await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      if (navigator.vibrate) navigator.vibrate(type === 'heavy' ? 40 : 15);
    }
  },

  onBack(callback) {
    if (Capacitor.getPlatform() !== 'android') return;
    return App.addListener('backButton', callback).catch(error => console.warn('Back listener unavailable', error));
  },

  onStateChange(callback) {
    if (!Capacitor.isNativePlatform()) return;
    return App.addListener('appStateChange', callback).catch(error => console.warn('App state listener unavailable', error));
  },

  async exit() {
    if (Capacitor.getPlatform() !== 'android') return;
    try { await App.exitApp(); }
    catch (error) { console.warn('App exit unavailable', error); }
  }
};
