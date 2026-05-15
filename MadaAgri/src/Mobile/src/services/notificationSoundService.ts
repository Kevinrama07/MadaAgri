import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import logger from '../utils/logger';

type NotificationType = 'message' | 'collaboration' | 'follow' | 'like' | 'comment' | 'default';

interface SoundConfig {
  file: any;
  volume: number;
}

class NotificationSoundService {
  private sounds: Map<NotificationType, Audio.Sound | null> = new Map();
  private enabled: boolean = true;
  private vibrationEnabled: boolean = true;
  private isInitialized: boolean = false;

  private soundFiles: Record<NotificationType, SoundConfig> = {
    message: {
      file: null, // require('../../assets/sounds/message.mp3'),
      volume: 0.5,
    },
    collaboration: {
      file: null, // require('../../assets/sounds/collaboration.mp3'),
      volume: 0.6,
    },
    follow: {
      file: null, // require('../../assets/sounds/follow.mp3'),
      volume: 0.5,
    },
    like: {
      file: null, // require('../../assets/sounds/like.mp3'),
      volume: 0.4,
    },
    comment: {
      file: null, // require('../../assets/sounds/comment.mp3'),
      volume: 0.5,
    },
    default: {
      file: null, // require('../../assets/sounds/notification.mp3'),
      volume: 0.5,
    },
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Configurer le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Précharger les sons (si disponibles)
      for (const [type, config] of Object.entries(this.soundFiles)) {
        try {
          if (config.file) {
            const { sound } = await Audio.Sound.createAsync(config.file, {
              volume: config.volume,
              shouldPlay: false,
            });
            this.sounds.set(type as NotificationType, sound);
          } else {
            this.sounds.set(type as NotificationType, null);
          }
        } catch (error) {
          logger.warn(`Failed to load sound for ${type}:`, error);
          this.sounds.set(type as NotificationType, null);
        }
      }

      this.isInitialized = true;
      logger.log('[NotificationSound] Service initialized (sounds disabled until files added)');
    } catch (error) {
      logger.error('[NotificationSound] Initialization failed:', error);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.log('[NotificationSound] Sound enabled:', enabled);
  }

  setVibrationEnabled(enabled: boolean): void {
    this.vibrationEnabled = enabled;
    logger.log('[NotificationSound] Vibration enabled:', enabled);
  }

  async playSound(type: NotificationType = 'default'): Promise<void> {
    if (!this.enabled) return;

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const sound = this.sounds.get(type) || this.sounds.get('default');
      
      if (sound) {
        // Arrêter et rembobiner si déjà en cours
        await sound.stopAsync();
        await sound.setPositionAsync(0);
        await sound.playAsync();
        logger.log(`[NotificationSound] Playing sound: ${type}`);
      }
    } catch (error) {
      logger.warn('[NotificationSound] Failed to play sound:', error);
    }
  }

  async vibrate(pattern?: Haptics.NotificationFeedbackType): Promise<void> {
    if (!this.vibrationEnabled) return;

    try {
      if (pattern) {
        await Haptics.notificationAsync(pattern);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      logger.log('[NotificationSound] Vibration triggered');
    } catch (error) {
      logger.warn('[NotificationSound] Vibration failed:', error);
    }
  }

  async notify(type: NotificationType = 'default'): Promise<void> {
    try {
      // Jouer le son
      await this.playSound(type);

      // Vibration selon le type
      const vibrationPatterns: Record<NotificationType, Haptics.NotificationFeedbackType> = {
        message: Haptics.NotificationFeedbackType.Success,
        collaboration: Haptics.NotificationFeedbackType.Warning,
        follow: Haptics.NotificationFeedbackType.Success,
        like: Haptics.NotificationFeedbackType.Success,
        comment: Haptics.NotificationFeedbackType.Success,
        default: Haptics.NotificationFeedbackType.Success,
      };

      await this.vibrate(vibrationPatterns[type]);
    } catch (error) {
      logger.warn('[NotificationSound] Notify failed:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      for (const sound of this.sounds.values()) {
        if (sound) {
          await sound.unloadAsync();
        }
      }
      this.sounds.clear();
      this.isInitialized = false;
      logger.log('[NotificationSound] Cleanup completed');
    } catch (error) {
      logger.error('[NotificationSound] Cleanup failed:', error);
    }
  }
}

export const notificationSoundService = new NotificationSoundService();
export default notificationSoundService;
