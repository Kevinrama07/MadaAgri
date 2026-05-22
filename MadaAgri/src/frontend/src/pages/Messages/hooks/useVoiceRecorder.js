import { useState, useRef, useCallback, useEffect } from 'react';

const MAX_DURATION_MS = 120000;

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDurationMs, setRecordingDurationMs] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const streamRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        setIsPermissionGranted(true);
      } catch (e) {
        setPermissionError('Microphone permission denied');
        setIsPermissionGranted(false);
      }
    })();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsPermissionGranted(true);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setRecordingBlob(null);
      setRecordingDurationMs(0);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordingBlob(blob);
      };

      recorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setRecordingDurationMs(elapsed);
        if (elapsed >= MAX_DURATION_MS) {
          recorder.stop();
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 100);
    } catch (e) {
      setPermissionError(e.message);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        setIsRecording(false);
        return;
      }

      recorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setRecordingBlob(blob);

        const url = URL.createObjectURL(blob);
        resolve({ blob, url, mimeType: recorder.mimeType });

        setIsRecording(false);
      };

      recorder.stop();
    });
  }, []);

  const cancelRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stream?.getTracks().forEach(t => t.stop());
      recorder.stop();
    }

    setIsRecording(false);
    setRecordingBlob(null);
    setRecordingDurationMs(0);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    isRecording,
    recordingDurationMs,
    recordingBlob,
    isPermissionGranted,
    startRecording,
    stopRecording,
    cancelRecording,
    permissionError,
  };
}

export default useVoiceRecorder;
