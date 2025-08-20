
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AppState, IrisAnalysis, HistoryItem } from './types';
import { analyzeIrisImage, createThumbnailDataUrl } from './services/geminiService';
import { IconCamera, IconUpload, IconSparkles, IconArrowLeft, IconInfo, IconHistory, IconSettings, IconRetry } from './components/IconComponents';
import Spinner from './components/Spinner';
import AnalysisResult from './components/AnalysisResult';
import DisclaimerModal from './components/DisclaimerModal';
import ShotTipsModal from './components/ShotTipsModal';
import PaywallModal from './components/PaywallModal';
import SettingsModal from './components/SettingsModal';
import InfoModal from './components/InfoModal';
import ProBadge from './components/ProBadge';
import HistoryScreen from './components/HistoryScreen';
import { logger } from './services/logger';
import heic2any from 'heic2any';
import CameraCapture from './components/CameraCapture';


const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisResult, setAnalysisResult] = useState<IrisAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  
  // Modals visibility state
  const [isDisclaimerVisible, setIsDisclaimerVisible] = useState(false);
  const [isShotTipsVisible, setIsShotTipsVisible] = useState(false);
  const [activeModal, setActiveModal] = useState<'settings' | 'paywall' | null>(null);
  const [infoModalContent, setInfoModalContent] = useState<{title: string, message: string} | null>(null);

  // User and subscription state
  const [isPro, setIsPro] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [lastScanReset, setLastScanReset] = useState<number>(Date.now());
  
  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const FREE_SCAN_LIMIT = 5;
  const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

  // Load state from localStorage on initial render
  useEffect(() => {
    const proStatus = localStorage.getItem('isPro') === 'true';
    setIsPro(proStatus);
    
    const storedScanCount = parseInt(localStorage.getItem('scanCount') || '0', 10);
    const storedLastReset = parseInt(localStorage.getItem('lastScanReset') || Date.now().toString(), 10);

    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - storedLastReset > oneWeek) {
      setScanCount(0);
      setLastScanReset(Date.now());
      localStorage.setItem('scanCount', '0');
      localStorage.setItem('lastScanReset', Date.now().toString());
    } else {
      setScanCount(storedScanCount);
      setLastScanReset(storedLastReset);
    }
    
    try {
      const storedHistory = JSON.parse(localStorage.getItem('scanHistory') || '[]');
      setHistory(storedHistory);
    } catch (e) {
      console.error("Failed to load history:", e);
      setHistory([]);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    // Prevent saving default empty array on first load if history exists
    if (history.length > 0 || localStorage.getItem('scanHistory')) {
      try {
        localStorage.setItem('scanHistory', JSON.stringify(history));
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          logger.error('LocalStorage quota exceeded. Failed to save the latest history item.', { historyLength: history.length });
          // The `history` state already includes the new item at the start.
          // Revert the state to before the new item was added and notify the user.
          const previousHistory = history.slice(1);
          setHistory(previousHistory);

          // Show an info modal to the user
          setInfoModalContent({
            title: "Storage Full",
            message: "Your analysis was successful, but it could not be saved to your history because device storage is full.\n\nPlease go to History and delete some older scans to make space."
          });
        } else {
          logger.error("An unexpected error occurred while saving history.", { error: e });
        }
      }
    }
  }, [history]);

  const handleImageSelected = useCallback(async (imageDataUrl: string) => {
    if (!isPro && scanCount >= FREE_SCAN_LIMIT) {
      setActiveModal('paywall');
      setAppState(AppState.IDLE); // Reset state if paywall is shown
      return;
    }

    setImageSrc(imageDataUrl);
    setAppState(AppState.ANALYZING);
    setError(null);
    setAnalysisResult(null);
    setAnalysisStatus('Verifying image...');

    try {
      const result = await analyzeIrisImage(imageDataUrl, setAnalysisStatus);
      setAnalysisResult(result);
      setAppState(AppState.SUCCESS);

      let historyImageSrc = imageDataUrl;
      try {
        // Create a smaller thumbnail for history to save space
        historyImageSrc = await createThumbnailDataUrl(imageDataUrl, 200);
      } catch (thumbError) {
        logger.warn('Could not create thumbnail for history item, using original image.', { error: thumbError });
        // Fallback to original image if thumbnail creation fails
      }

      const newHistoryItem: HistoryItem = {
        id: Date.now(),
        date: new Date().toISOString(),
        imageSrc: historyImageSrc, // Use the thumbnail
        analysis: result,
      };
      setHistory(prev => [newHistoryItem, ...prev]);

      if (!isPro) {
          setScanCount(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
      setError(errorMessage);
      setAppState(AppState.ERROR);
    }
  }, [isPro, scanCount]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let file = event.target.files?.[0];
    if (!file) return;

    logger.info('File selected.', { fileName: file.name, fileSize: file.size, fileType: file.type });

    // 0. Pre-emptive file size check to prevent browser crashes on mobile
    if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File is too large (over 20MB). Please choose a smaller file or use the app's camera.`);
        setAppState(AppState.ERROR);
        setImageSrc(null); // Clear any previous image preview
        event.target.value = ''; // Reset file input
        return;
    }

    // 1. Zero-byte file check
    if (file.size === 0) {
        setError("The selected file is empty. Please choose a valid image file.");
        setAppState(AppState.ERROR);
        setImageSrc(null); // Clear any previous image preview
        event.target.value = ''; // Reset file input
        return;
    }

    // 2. File type validation
    const supportedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/avif'];
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    const isSupported = supportedTypes.includes(fileType) || 
                        fileName.endsWith('.jpg') ||
                        fileName.endsWith('.jpeg') ||
                        fileName.endsWith('.png') ||
                        fileName.endsWith('.heic') ||
                        fileName.endsWith('.heif') ||
                        fileName.endsWith('.avif');

    if (!isSupported) {
        setError("Unsupported file type. For best results, please upload a JPEG, PNG, or use the app's camera to take a new photo.");
        setAppState(AppState.ERROR);
        setImageSrc(null); // Clear any previous image preview
        event.target.value = ''; // Reset file input
        return;
    }


    setAppState(AppState.ANALYZING);
    setError(null);
    setAnalysisStatus('Processing image...');
    setImageSrc(URL.createObjectURL(file)); // Show temporary preview

    try {
      // Check for HEIC/HEIF format and convert if necessary
      const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
      if (isHeic) {
        setAnalysisStatus('Converting image from HEIC...');
        logger.info('HEIC image detected, starting conversion.', { fileName: file.name });
        const conversionResult = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.9,
        });
        const jpegBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
        file = new File([jpegBlob], "converted.jpg", { type: "image/jpeg" });
        logger.info('HEIC conversion successful.');
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string' && e.target.result.startsWith('data:image')) {
          handleImageSelected(e.target.result);
        } else {
          const errorMsg = "Failed to read image file. The file format may not be supported or the file is corrupted.";
          logger.error(errorMsg, { fileType: file?.type, fileName: file?.name, resultType: typeof e.target?.result });
          setError(errorMsg);
          setAppState(AppState.ERROR);
        }
      };
      reader.onerror = (e) => {
        const errorMsg = "Could not read the selected file. Please check file permissions and try again.";
        logger.error(errorMsg, { fileName: file?.name, readerError: reader.error });
        setError(errorMsg);
        setAppState(AppState.ERROR);
      };
      reader.readAsDataURL(file);

    } catch (err) {
      const errorMsg = "Failed to process image. The HEIC format conversion failed. Please try a standard JPEG or PNG.";
      logger.error(errorMsg, { originalFileName: file.name, error: err });
      setError(errorMsg);
      setAppState(AppState.ERROR);
    } finally {
      // Reset file input value to allow re-selection of the same file
      event.target.value = '';
    }
  };


  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    setAppState(AppState.CAMERA_ACTIVE);
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setAnalysisResult(null);
    setError(null);
    setImageSrc(null);
  };

  const handlePurchase = (success: boolean) => {
    setActiveModal(null); // Close paywall
    if (success) {
        setIsPro(true);
        setInfoModalContent({
            title: "Thank You",
            message: "Thank you. Enjoy your premium access."
        });
    } else {
        setInfoModalContent({
            title: "Payment Issue",
            message: "There was an issue processing your payment. Please try again later or contact support."
        });
    }
  };
  
  const handleCloseInfoModal = () => {
      if(isPro && infoModalContent?.title === "Thank You") {
        resetApp();
      }
      setInfoModalContent(null);
  };

  const handleViewHistoryItem = (item: HistoryItem) => {
    setAnalysisResult(item.analysis);
    setImageSrc(item.imageSrc);
    setAppState(AppState.SUCCESS);
  };

  const handleDeleteHistoryItem = (id: number) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };
  
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all analysis history? This cannot be undone.")) {
        setHistory([]);
    }
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.CAMERA_ACTIVE:
        return (
          <CameraCapture
            onCapture={handleImageSelected}
            onClose={() => setAppState(AppState.IDLE)}
          />
        );
      case AppState.HISTORY:
        return (
          <HistoryScreen
            history={history}
            onViewItem={handleViewHistoryItem}
            onDeleteItem={handleDeleteHistoryItem}
            onClearAll={handleClearHistory}
            onBack={() => setAppState(AppState.IDLE)}
          />
        );
      case AppState.ANALYZING:
        return (
          <div className="flex flex-col items-center justify-center text-center animate-fade-in">
            {imageSrc && (
              <img src={imageSrc} alt="Eye for analysis" className="w-48 h-48 rounded-full object-cover border-4 border-brand-teal shadow-lg mb-6" />
            )}
            <Spinner />
            <h2 className="text-2xl font-bold mt-4 text-brand-teal">Analyzing Iris...</h2>
            <p className="text-gray-400 mt-2 h-6">{analysisStatus || 'Our AI is looking deep into your eye...'}</p>
          </div>
        );
      case AppState.SUCCESS:
        return analysisResult && imageSrc && (
          <AnalysisResult result={analysisResult} imageSrc={imageSrc} onReset={resetApp} />
        );
      case AppState.ERROR:
         return (
          <div className="text-center animate-fade-in flex flex-col items-center">
            {imageSrc && (
              <img src={imageSrc} alt="Failed analysis subject" className="w-48 h-48 rounded-full object-cover border-4 border-red-500 shadow-lg mb-6" />
            )}
            <h2 className="text-2xl font-bold text-red-500">Analysis Failed</h2>
            <p className="text-gray-300 mt-2 max-w-md whitespace-pre-line">
                {error || 'There was a problem analyzing your image. Please check your internet connection and try again with a clear, well-lit photo.'}
            </p>
            {error && (
                <details className="mt-4 text-left text-xs text-gray-400 max-w-md w-full">
                    <summary className="cursor-pointer text-center text-gray-500">Show Technical Details</summary>
                    <pre className="mt-2 bg-gray-800 p-2 rounded-lg overflow-auto whitespace-pre-wrap">
                        {error}
                    </pre>
                </details>
            )}
            <button
              onClick={resetApp}
              className="mt-6 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <IconRetry className="w-5 h-5"/>
              Try Again
            </button>
          </div>
        );
      case AppState.IDLE:
      default:
        const scansLeft = Math.max(0, FREE_SCAN_LIMIT - scanCount);
        return (
          <div className="text-center animate-fade-in">
            <div className="mb-4 flex justify-center text-brand-pink">
              <IconSparkles className="w-16 h-16" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">Iris Analyzer</h1>
            <p className="mt-4 text-lg text-gray-300 max-w-xl mx-auto">
              Discover the story in your eyes. Upload or capture a high-quality photo of your iris for a fun AI-powered analysis.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png,image/jpeg,image/heic,image/heif,.png,.jpg,.jpeg,.heic,.heif,image/avif"
                className="hidden"
              />
              <button
                onClick={handleUploadClick}
                className="flex items-center justify-center gap-3 bg-brand-purple hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <IconUpload />
                Upload Eye Photo
              </button>
              <button
                onClick={handleCameraClick}
                className="flex items-center justify-center gap-3 bg-brand-teal hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <IconCamera />
                Use Camera
              </button>
            </div>
            <div className="mt-8 flex justify-center items-center gap-4 sm:gap-8">
              <button 
                onClick={() => setIsDisclaimerVisible(true)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium" 
                aria-label="View disclaimer"
              >
                <IconInfo className="w-5 h-5" />
                <span>Disclaimer</span>
              </button>
              <button 
                onClick={() => setIsShotTipsVisible(true)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium" 
                aria-label="View tips for taking a good photo"
              >
                <IconCamera className="w-5 h-5" />
                <span>Shot Tips</span>
              </button>
            </div>

            {!isPro && (
              <p className="mt-4 text-sm text-gray-400">
                You have used {scanCount} {scanCount === 1 ? 'scan' : 'scans'} this week, {scansLeft} left.
              </p>
            )}

            <div className="mt-12 w-full max-w-xs mx-auto border-t border-white/10 pt-6 flex justify-around items-center">
                <button 
                    onClick={() => setAppState(AppState.HISTORY)}
                    className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
                    aria-label="View analysis history"
                >
                    <IconHistory className="w-6 h-6" />
                    <span className="text-xs font-medium tracking-wider uppercase">History</span>
                </button>
                <button 
                    onClick={() => setActiveModal('settings')}
                    className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
                    aria-label="Open settings"
                >
                    <IconSettings className="w-6 h-6" />
                    <span className="text-xs font-medium tracking-wider uppercase">Settings</span>
                </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 flex flex-col items-center justify-center p-4 relative">
      {isPro && <ProBadge />}
      <main className="w-full max-w-4xl mx-auto">
        {renderContent()}
      </main>
      
      {/* Modals */}
      {isDisclaimerVisible && <DisclaimerModal onClose={() => setIsDisclaimerVisible(false)} />}
      {isShotTipsVisible && <ShotTipsModal onClose={() => setIsShotTipsVisible(false)} />}
      
      {activeModal === 'paywall' && <PaywallModal scanCount={scanCount} onUpgrade={() => handlePurchase(true)} onClose={() => setActiveModal(null)} />}
      {activeModal === 'settings' && (
        <SettingsModal 
            onClose={() => setActiveModal(null)} 
        />
      )}
      {infoModalContent && (
        <InfoModal
            title={infoModalContent.title}
            message={infoModalContent.message}
            onClose={handleCloseInfoModal}
        />
      )}

    </div>
  );
};

export default App;
