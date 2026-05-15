class NotificationSoundService {
  constructor() {
    this.sounds = {
      message: new Audio('/sounds/message.mp3'),
      collaboration: new Audio('/sounds/collaboration.mp3'),
      follow: new Audio('/sounds/follow.mp3'),
      default: new Audio('/sounds/notification.mp3')
    };
    this.enabled = true;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  play(type = 'default') {
    if (!this.enabled) return;
    
    try {
      const sound = this.sounds[type] || this.sounds.default;
      sound.currentTime = 0;
      sound.volume = 0.5;
      sound.play().catch(err => console.warn('Sound play failed:', err));
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  vibrate(pattern = [200]) {
    if (!this.enabled) return;
    
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.warn('Vibration failed:', error);
    }
  }

  notify(type = 'default') {
    this.play(type);
    
    const patterns = {
      message: [100, 50, 100],
      collaboration: [200, 100, 200],
      follow: [150],
      default: [200]
    };
    
    this.vibrate(patterns[type] || patterns.default);
  }
}

export default new NotificationSoundService();
