
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { IconCamera, IconX, IconRetry, IconSwitchCamera } from './IconComponents';
import Spinner from './Spinner';
import { logger } from '../services/logger';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [retry, setRetry] = useState(0);
  const loadingTimeoutRef = useRef<number | null>(null);

  // Check for multiple cameras on mount
  useEffect(() => {
    const checkForMultipleCameras = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          logger.warn("enumerateDevices() not supported.");
          return;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        if (videoInputs.length > 1) {
          setHasMultipleCameras(true);
          logger.info('Multiple cameras detected.', { count: videoInputs.length });
        }
      } catch (err) {
        logger.warn('Could not enumerate devices.', { error: err });
      }
    };
    checkForMultipleCameras();
  }, []);

  // Effect to start/switch camera when facingMode or retry count changes
  useEffect(() => {
    let isMounted = true;

    // Stop any existing stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    setError(null);
    setIsLoading(true);

    const startCamera = async () => {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      };
      
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = window.setTimeout(() => {
          if (!isMounted) return;
          setIsLoading(false);
          setError("Camera failed to start in time. Please check your browser permissions and retry.");
          logger.warn('Camera start timed out.');
      }, 10000); // 10-second timeout

      try {
        logger.info('Attempting to start camera.', { constraints });
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isMounted) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } else {
            mediaStream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        if (!isMounted) return;

        logger.error(`Error starting camera with mode: ${facingMode}`, { error: err });

        // If environment camera fails, automatically try user camera once.
        if (facingMode === 'environment') {
          logger.warn('Environment camera failed, trying user camera.');
          setFacingMode('user'); // This will re-trigger the useEffect
          return;
        }

        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
        setIsLoading(false);
        // Handle common errors
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError('Camera permission denied. Please enable camera access in your browser/system settings and try again.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setError('No camera found on this device. Please ensure a camera is connected and enabled.');
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            setError('Camera is currently in use by another application. Please close the other app and try again.');
          } else if (err.name === 'OverconstrainedError') {
            setError(`Your device's camera does not support the required settings. Please try another camera if available.`);
          } else {
            setError(`Could not start camera. An unexpected error occurred: ${err.name}`);
          }
        } else {
          setError('An unknown error occurred while trying to access the camera.');
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [facingMode, retry]);

  const onVideoReady = () => {
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    if (isLoading) {
      setIsLoading(false);
      logger.info('Video stream is now playing.');
    }
  };
  
  const handleSwitchCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && stream?.active) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (context) {
        // Flip image horizontally if it's the front camera to get a non-mirrored image
        if(facingMode === 'user') {
            context.translate(video.videoWidth, 0);
            context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        
        // Stop the stream and pass the image back
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        onCapture(dataUrl);
      }
    } else {
        logger.warn('Capture attempted but stream was not active or elements not ready.');
        setError('Could not capture image. The camera stream may have been interrupted.');
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setRetry(c => c + 1);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center animate-fade-in">
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      <div className="absolute top-4 right-4 z-20">
        <button onClick={onClose} className="p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors" aria-label="Close camera">
          <IconX className="w-6 h-6" />
        </button>
      </div>

      <div className="relative w-full h-full flex items-center justify-center">
        {isLoading && (
            <div className="text-center">
                <Spinner />
                <p className="text-white mt-4">Starting camera...</p>
            </div>
        )}
        
        {error && (
           <div className="text-center text-white p-4 max-w-md">
             <h2 className="text-xl font-bold text-red-500 mb-4">Camera Error</h2>
             <p className="mb-6 whitespace-pre-line">{error}</p>
             <button onClick={handleRetry} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                <IconRetry className="w-5 h-5"/>
                Try Again
             </button>
           </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onCanPlay={onVideoReady}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)' }} // Mirror front camera for selfie view
          aria-label="Camera feed"
        />

        {!isLoading && !error && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 border-dashed border-white/50 animate-pulse"></div>
                <p className="absolute top-[20%] text-white bg-black/50 px-3 py-1 rounded-lg text-sm font-medium">Align your eye in the circle</p>
            </div>
            <div className="absolute bottom-8 z-20 flex justify-center items-center w-full gap-16">
              <div className="w-20 h-20 flex items-center justify-center">
                {hasMultipleCameras && (
                  <button onClick={handleSwitchCamera} className="w-14 h-14 bg-black/50 rounded-full flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-transform transform hover:scale-110" aria-label="Switch camera">
                    <IconSwitchCamera className="w-7 h-7" />
                  </button>
                )}
              </div>
              <button onClick={handleCapture} className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-gray-400 focus:outline-none focus:ring-4 focus:ring-brand-teal transition-transform transform hover:scale-110" aria-label="Take picture">
                <IconCamera className="w-10 h-10 text-gray-800" />
              </button>
              <div className="w-20 h-20"></div> {/* Spacer to balance the layout */}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
