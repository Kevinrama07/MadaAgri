import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

interface VoiceRecorderProps {
  isRecording: boolean;
  onRecordingStart: () => void;
  onRecordingStop: (uri: string | null, durationMs: number) => void;
  disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isRecording: isRecordingProp,
  onRecordingStart,
  onRecordingStop,
  disabled,
}) => {
  const { colors } = useTheme();
  const {
    isRecording,
    recordingDurationMs,
    isPermissionGranted,
    startRecording,
    stopRecording,
    permissionError,
  } = useVoiceRecorder();

  const recordingDurationRef = useRef(0);

  useEffect(() => {
    if (isRecording) {
      recordingDurationRef.current = recordingDurationMs;
    }
  }, [recordingDurationMs, isRecording]);

  const handleToggle = useCallback(async () => {
    if (disabled) return;

    if (!isRecordingProp) {
      await startRecording();
      onRecordingStart();
    } else {
      const uri = await stopRecording();
      onRecordingStop(uri, recordingDurationRef.current);
    }
  }, [disabled, isRecordingProp, startRecording, stopRecording, onRecordingStart, onRecordingStop]);

  const color = isRecordingProp ? colors.error : colors.primary;
  const iconName = isRecordingProp ? 'stop-circle' : (isPermissionGranted ? 'microphone' : 'microphone-off');

  return (
    <Pressable
      onPress={handleToggle}
      disabled={disabled || (!isRecordingProp && !isPermissionGranted)}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: (disabled || (!isRecordingProp && !isPermissionGranted)) ? 0.4 : pressed ? 0.6 : 1,
      })}
    >
      <MaterialCommunityIcons name={iconName as any} size={isRecordingProp ? 28 : 22} color={color} />
    </Pressable>
  );
};

export default VoiceRecorder;
