
import React, { useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { IrisAnalysis } from '../types';
import { IconX, IconEye } from './IconComponents';
import Spinner from './Spinner';

// This is the component that will be captured as an image.
// It's defined here for encapsulation and styled with Tailwind.
const ShareableCard = React.forwardRef<HTMLDivElement, { result: IrisAnalysis, imageSrc: string }>(({ result, imageSrc }, ref) => {
    return (
        <div ref={ref} className="bg-gradient-to-br from-gray-900 to-indigo-900 text-white font-sans w-[800px] h-[800px] flex flex-col items-center justify-center p-10">
            <img src={imageSrc} alt="Analyzed eye" className="w-[300px] h-[300px] rounded-full object-cover border-8 border-brand-teal" />

            <h1 className="text-5xl font-extrabold mt-5 text-white text-center">
                {result.dominantColor.name} Eye Analysis
            </h1>

            <div className="flex gap-8 mt-8">
                <div className="text-center">
                    <p className="text-2xl text-gray-400">Rarity</p>
                    <p className="text-5xl font-bold text-brand-pink">{100 - result.rarityIndex.percentage}%</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl text-gray-400">Personality Vibe</p>
                    <p className="text-5xl font-bold text-brand-purple">{result.personalityVibe.title}</p>
                </div>
            </div>

            <div className="mt-auto w-full border-t-2 border-white/20 pt-5">
                <p className="text-3xl text-center text-gray-300">
                    Check out my unique results! Click the app link below to see yours.
                </p>
                <p className="text-2xl text-center font-bold text-brand-teal mt-2">
                    iris-analyzer.app
                </p>
                <div className="flex items-center justify-end mt-5 opacity-80">
                    <IconEye className="w-6 h-6" />
                    <span className="text-xl ml-2 font-semibold">Iris Analyzer</span>
                </div>
            </div>
        </div>
    );
});

// Helper function to fetch Google Fonts CSS and embed fonts as data URIs to prevent CORS issues.
const getFontEmbedCss = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch font CSS: ${response.statusText}`);
        }
        let cssText = await response.text();
        const fontUrls = cssText.match(/url\((https:\/\/[^)]+)\)/g);

        if (!fontUrls) return cssText;

        const fontPromises = fontUrls.map(async (fontUrlMatch) => {
            const url = fontUrlMatch.replace(/url\(['"]?|['"]?\)/g, '');
            try {
                const fontResponse = await fetch(url);
                 if (!fontResponse.ok) return null;
                const blob = await fontResponse.blob();
                return new Promise<[string, string] | null>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(typeof reader.result === 'string' ? [url, reader.result] : null);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(blob);
                });
            } catch {
                return null;
            }
        });

        const fontDataPairs = (await Promise.all(fontPromises)).filter(Boolean) as [string, string][];
        const fontMap = new Map(fontDataPairs);

        return cssText.replace(/url\((https:\/\/[^)]+)\)/g, (match) => {
            const url = match.replace(/url\(['"]?|['"]?\)/g, '');
            return fontMap.has(url) ? `url(${fontMap.get(url)})` : match;
        });
    } catch (error) {
        console.error("Error embedding fonts:", error);
        return ''; // Return empty string on failure
    }
};


interface ShareModalProps {
    result: IrisAnalysis;
    imageSrc: string;
    onClose: () => void;
    onShareComplete: () => void;
}

const dataUrlToBlob = (dataUrl: string): Blob => {
    const parts = dataUrl.split(',');
    const contentType = parts[0].split(':')[1].split(';')[0];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
};


export const ShareModal: React.FC<ShareModalProps> = ({ result, imageSrc, onClose, onShareComplete }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const generateImage = async () => {
            if (!cardRef.current) {
                // This might run before the ref is attached, so we retry briefly.
                setTimeout(generateImage, 50);
                return;
            }
            try {
                // The delay helps ensure all images and fonts are loaded in the off-screen div
                await new Promise(resolve => setTimeout(resolve, 500));

                const fontEmbedCss = await getFontEmbedCss('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                
                const dataUrl = await toPng(cardRef.current, { 
                    quality: 0.95, 
                    pixelRatio: 2,
                    fontEmbedCSS: fontEmbedCss,
                });

                setGeneratedImage(dataUrl);
            } catch (err) {
                console.error("Failed to generate shareable image:", err);
                setError("Sorry, we couldn't create the shareable image. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        generateImage();
    }, []);

    const handleShare = async () => {
        if (!generatedImage) return;

        try {
            const blob = dataUrlToBlob(generatedImage);
            const file = new File([blob], 'iris-analysis.png', { type: 'image/png' });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'My Iris Analysis',
                    text: 'Check out my results from the Iris Analyzer app!',
                    files: [file],
                });
                onShareComplete();
            } else {
                 // Fallback for desktop or browsers that don't support file sharing
                const link = document.createElement('a');
                link.href = generatedImage;
                link.download = 'iris-analysis.png';
                link.click();
                setError("Sharing not supported. Image downloaded instead!");
            }
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                setError("Sharing failed. You can download the image from the preview.");
                console.error("Share API error:", err);
            }
            // If AbortError, the user cancelled the share, so we do nothing.
        }
    };


    return (
        <>
            {/* This is the off-screen component that gets captured */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
                <ShareableCard ref={cardRef} result={result} imageSrc={imageSrc} />
            </div>

            {/* This is the visible modal */}
            <div
                className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
                onClick={onClose}
            >
                <div
                    className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-6 rounded-2xl shadow-2xl w-full max-w-lg relative border border-gray-200 dark:border-white/20 mx-4 flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors" aria-label="Close">
                        <IconX className="w-6 h-6" />
                    </button>
                    <h2 className="text-2xl font-bold text-brand-teal mb-4">Share Your Results</h2>

                    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 flex-grow flex items-center justify-center min-h-[300px]">
                        {isLoading && <Spinner />}
                        {error && !isLoading && <p className="text-red-500 text-center">{error}</p>}
                        {generatedImage && !isLoading && (
                            <img src={generatedImage} alt="Analysis preview" className="max-w-full max-h-[400px] rounded-lg object-contain" />
                        )}
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={onClose}
                            className="w-full bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleShare}
                            disabled={isLoading || !generatedImage}
                            className="w-full bg-brand-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Share Now
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};