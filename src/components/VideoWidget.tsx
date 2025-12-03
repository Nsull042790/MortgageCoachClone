import { useState, useRef, useEffect } from 'react';
import {
  PlayIcon,
  XMarkIcon,
  VideoCameraIcon,
  StopIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/solid';
import { useLoan } from '../context/LoanContext';
import { uploadToVimeo } from '../utils/vimeoUpload';

type WidgetMode = 'collapsed' | 'playing' | 'recording' | 'preview' | 'uploading';

export function VideoWidget() {
  const { currentScenario, updateVideoMessage, isClientView } = useLoan();
  const videoMessage = currentScenario.videoMessage;

  const [mode, setMode] = useState<WidgetMode>('collapsed');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Vimeo ID from scenario (no default - LO must set one)
  const vimeoId = videoMessage?.vimeoId;
  const hasRecordedVideo = videoMessage?.recordedVideoUrl || recordedUrl;
  const hasVideo = vimeoId || hasRecordedVideo;

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMode('recording');
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera. Please ensure you have granted permission.');
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    // Countdown before recording
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          beginRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const beginRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9,opus',
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      setRecordedBlob(blob);
      setMode('preview');

      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveRecording = async () => {
    if (!recordedBlob) return;

    setMode('uploading');
    setUploadError(null);

    const result = await uploadToVimeo(recordedBlob);

    if (result.success && result.videoId) {
      // Save the Vimeo ID to the scenario
      updateVideoMessage({ vimeoId: result.videoId });
      setUploadSuccess(true);

      // Clean up local blob URL
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
      setRecordedUrl(null);
      setRecordedBlob(null);

      // Show success briefly then close
      setTimeout(() => {
        setUploadSuccess(false);
        setMode('collapsed');
      }, 2000);
    } else {
      setUploadError(result.error || 'Upload failed');
      setMode('preview'); // Go back to preview to retry
    }
  };

  const retakeRecording = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedUrl(null);
    setRecordedBlob(null);
    setUploadError(null);
    startCamera();
  };

  const closeWidget = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setMode('collapsed');
  };

  // Collapsed state - floating button
  if (mode === 'collapsed') {
    // In client view, only show if there's a video to watch
    if (isClientView && !hasVideo) {
      return null;
    }

    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
        {/* Record button - hidden for clients */}
        {!isClientView && (
          <button
            onClick={startCamera}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
            title="Record video message"
          >
            <VideoCameraIcon className="w-6 h-6" />
          </button>
        )}

        {/* Play button */}
        <button
          onClick={() => setMode('playing')}
          className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 ring-4 ring-blue-200"
          title="Play video message"
        >
          <PlayIcon className="w-8 h-8 ml-1" />
        </button>
      </div>
    );
  }

  // Playing state - expanded video player
  if (mode === 'playing') {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-80 md:w-96">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-100 border-b">
            <span className="text-sm font-medium text-gray-700">Video Message</span>
            <button
              onClick={closeWidget}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Video */}
          <div className="aspect-video bg-black">
            {hasRecordedVideo ? (
              <video
                src={videoMessage?.recordedVideoUrl || recordedUrl || undefined}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            ) : vimeoId ? (
              <iframe
                src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-center p-4">
                <div>
                  <p className="font-medium">No video message yet</p>
                  <p className="text-sm text-gray-400 mt-1">Record a video to include with this scenario</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {hasRecordedVideo ? 'Recorded message' : 'From your loan officer'}
            </span>
            {!isClientView && (
              <button
                onClick={startCamera}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <VideoCameraIcon className="w-4 h-4" />
                Record new
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Recording state
  if (mode === 'recording') {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-80 md:w-96">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-red-500 text-white">
            <span className="text-sm font-medium flex items-center gap-2">
              {isRecording && (
                <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
              )}
              {isRecording ? 'Recording...' : 'Camera Ready'}
            </span>
            <button
              onClick={closeWidget}
              className="p-1 rounded-full hover:bg-red-400"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Video preview */}
          <div className="aspect-video bg-black relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* Countdown overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-6xl font-bold animate-pulse">
                  {countdown}
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="px-4 py-4 bg-gray-50 flex justify-center gap-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium flex items-center gap-2 transition-colors"
              >
                <div className="w-3 h-3 bg-white rounded-full" />
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-full font-medium flex items-center gap-2 transition-colors"
              >
                <StopIcon className="w-4 h-4" />
                Stop Recording
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Preview state - after recording
  if (mode === 'preview') {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-80 md:w-96">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-green-500 text-white">
            <span className="text-sm font-medium">Preview Recording</span>
            <button
              onClick={closeWidget}
              className="p-1 rounded-full hover:bg-green-400"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Video preview */}
          <div className="aspect-video bg-black">
            <video
              src={recordedUrl || undefined}
              controls
              className="w-full h-full object-cover"
            />
          </div>

          {/* Error message */}
          {uploadError && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-100">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <ExclamationCircleIcon className="w-4 h-4" />
                {uploadError}
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="px-4 py-4 bg-gray-50 flex justify-center gap-3">
            <button
              onClick={retakeRecording}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-medium flex items-center gap-2 transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Retake
            </button>
            <button
              onClick={saveRecording}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium transition-colors flex items-center gap-2"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              Upload & Use
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Uploading state
  if (mode === 'uploading') {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-80 md:w-96">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-500 text-white">
            <span className="text-sm font-medium flex items-center gap-2">
              {uploadSuccess ? (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Upload Complete!
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className="w-5 h-5 animate-bounce" />
                  Uploading to Vimeo...
                </>
              )}
            </span>
          </div>

          {/* Progress area */}
          <div className="aspect-video bg-gray-900 flex items-center justify-center">
            {uploadSuccess ? (
              <div className="text-center">
                <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-3" />
                <p className="text-white font-medium">Video ready to share!</p>
                <p className="text-gray-400 text-sm mt-1">
                  Your video will appear in the share link
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white font-medium">Uploading video...</p>
                <p className="text-gray-400 text-sm mt-1">This may take a moment</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
