import { Platform, Linking, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import logger from '../utils/logger';

export const shareService = {
  // Share app
  shareApp: async () => {
    try {
      const result = await Share.share({
        message: 'Téléchargez MadaAgri - La plateforme agricole de Madagascar!',
        url: 'https://madaagri.com/download',
        title: 'MadaAgri',
      });

      if (result.action === Share.sharedAction) {
        logger.log('App shared successfully');
      }
    } catch (error) {
      logger.error('Error sharing app:', error);
    }
  },

  // Share content
  shareContent: async (title, message, url = null) => {
    try {
      const result = await Share.share({
        message: message + (url ? `\n${url}` : ''),
        title,
        url: Platform.OS === 'ios' ? url : undefined,
      });

      if (result.action === Share.sharedAction) {
        logger.log('Content shared successfully');
      }
    } catch (error) {
      logger.error('Error sharing content:', error);
    }
  },

  // Copy to clipboard
  copyToClipboard: async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      logger.log('Text copied to clipboard');
      Alert.alert('Succès', 'Copié dans le presse-papiers');
    } catch (error) {
      logger.error('Error copying to clipboard:', error);
    }
  },

  // Share file
  shareFile: async (fileUri, mimeType = 'application/pdf') => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Erreur', 'Le partage de fichiers n\'est pas disponible');
        return;
      }

      await Sharing.shareAsync(fileUri, { mimeType });
      logger.log('File shared successfully');
    } catch (error) {
      logger.error('Error sharing file:', error);
    }
  },

  // Open URL
  openURL: async (url) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        logger.log('URL opened:', url);
      } else {
        logger.warn('Cannot open URL:', url);
      }
    } catch (error) {
      logger.error('Error opening URL:', error);
    }
  },

  // Send email
  sendEmail: async (email, subject = '', body = '') => {
    try {
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      await shareService.openURL(mailtoUrl);
    } catch (error) {
      logger.error('Error sending email:', error);
    }
  },

  // Send SMS
  sendSMS: async (phoneNumber, message = '') => {
    try {
      const smsUrl = `sms:${phoneNumber}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(
        message
      )}`;
      await shareService.openURL(smsUrl);
    } catch (error) {
      logger.error('Error sending SMS:', error);
    }
  },

  // Open phone dialer
  callPhone: async (phoneNumber) => {
    try {
      await shareService.openURL(`tel:${phoneNumber}`);
    } catch (error) {
      logger.error('Error calling phone:', error);
    }
  },

  // Open maps
  openMaps: async (latitude, longitude, label = '') => {
    try {
      const url =
        Platform.OS === 'ios'
          ? `maps:0,0?q=${label}@${latitude},${longitude}`
          : `geo:${latitude},${longitude}?q=${label}`;

      await shareService.openURL(url);
    } catch (error) {
      logger.error('Error opening maps:', error);
    }
  },
};

export default shareService;
