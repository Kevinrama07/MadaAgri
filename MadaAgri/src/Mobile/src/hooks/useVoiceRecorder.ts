import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio, AVMode } from 'expo-av';
import { Platform } from 'react-native';

const MAX_DURATION_MS = 120000;

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  recordingDurationMs: number;
  recordingUri: string | null;
  isPermissionGranted: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => void;
  permissionError: string | null;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDurationMs, setRecordingDurationMs] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        const { granted } = await Audio.requestPermissionsAsync();
        setIsPermissionGranted(granted);
        if (!granted) {
          setPermissionError('Permission microphone requise');
        }
      } catch (e: any) {
        setPermissionError(e.message);
      }
    })();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setPermissionError(null);
      const { granted } = await Audio.getPermissionsAsync();
      if (!granted) {
        const { granted: newGrant } = await Audio.requestPermissionsAsync();
        if (!newGrant) {
          setPermissionError('Permission microphone requise');
          return;
        }
        setIsPermissionGranted(true);
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          extension: '.mp4',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        },
      });

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingUri(null);
      setRecordingDurationMs(0);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setRecordingDurationMs(elapsed);
        if (elapsed >= MAX_DURATION_MS) {
          stopRecording();
        }
      }, 100);

      await recording.startAsync();
    } catch (e: any) {
      setPermissionError(e.message);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!recordingRef.current) return null;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);

      if (uri) {
        setRecordingUri(uri);
        return uri;
      }
    } catch (e: any) {
      console.error('[VoiceRecorder] stop error:', e.message);
    }

    return null;
  }, []);

  const cancelRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }

    setIsRecording(false);
    setRecordingUri(null);
    setRecordingDurationMs(0);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  return {
    isRecording,
    recordingDurationMs,
    recordingUri,
    isPermissionGranted,
    startRecording,
    stopRecording,
    cancelRecording,
    permissionError,
  };
}

export default useVoiceRecorder;
