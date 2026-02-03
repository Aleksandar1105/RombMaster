import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';

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
    App.addListener('backButton', callback);
  }
};