
import React, { useState } from 'react';
import { IconX, IconSettings, IconStar } from './IconComponents';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
import ThemeToggle from './ThemeToggle';

// --- IMPORTANT: FIREBASE SETUP REQUIRED ---
// To enable the feedback feature, you must configure Firebase.
// 1. Create a project at https://console.firebase.google.com/
// 2. In Project Settings, create a Web App (</>) and copy the `firebaseConfig` object.
// 3. PASTE the copied `firebaseConfig` object below, replacing the empty object.
// 4. In the Firebase console, go to Firestore Database, create a database in production mode,
//    and update the Rules to allow feedback submissions (see the main response for the rules to copy).
const firebaseConfig = {
  // PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE
};


let firestore: Firestore | null = null;
// Only initialize Firebase if a config with a projectId is provided.
// @ts-ignore
if (firebaseConfig.projectId) {
    try {
        if (!getApps().length) {
            const app = initializeApp(firebaseConfig);
            firestore = getFirestore(app);
        } else {
            firestore = getFirestore(getApps()[0]);
        }
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
}


interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState('');
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleManageSubscription = () => {
    window.open('https://play.google.com/store/account/subscriptions', '_blank', 'noopener,noreferrer');
  };
  
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    if (!firestore) {
        setErrorMessage('The feedback feature is not configured for this app.');
        setSubmissionState('error');
        console.error("Firestore is not initialized. Please provide your firebaseConfig.");
        return;
    }

    setSubmissionState('submitting');
    setErrorMessage('');

    try {
        await addDoc(collection(firestore, 'feedback'), {
            rating,
            comments,
            createdAt: serverTimestamp(),
            userAgent: navigator.userAgent, // Anonymous but useful for debugging
        });
        setSubmissionState('submitted');
    } catch (error) {
        console.error("Error submitting feedback:", error);
        setErrorMessage('Failed to submit feedback. Please try again later.');
        setSubmissionState('error');
    }
  };


  const renderFeedbackSection = () => {
    if (submissionState === 'submitted') {
        return (
            <div className="text-center p-8 bg-gray-100 dark:bg-white/10 rounded-lg mt-6 pt-6 border-t border-gray-200 dark:border-white/20">
                <h3 className="text-xl font-bold text-brand-teal">Thank you for your feedback!</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">We appreciate you helping us improve the app.</p>
            </div>
        );
    }

    return (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/20">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">How did we do?</h3>
            <form onSubmit={handleSubmitFeedback}>
                <div className="flex justify-center items-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            type="button"
                            key={star}
                            className="text-yellow-400 transition-transform transform hover:scale-125 focus:outline-none"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                            <IconStar 
                                className="w-8 h-8" 
                                filled={(hoverRating || rating) >= star}
                            />
                        </button>
                    ))}
                </div>
                <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Optional: Tell us what you think..."
                    className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-white/20 rounded-lg p-3 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                    rows={3}
                />
                <button
                    type="submit"
                    disabled={rating === 0 || submissionState === 'submitting'}
                    className="w-full mt-4 bg-brand-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submissionState === 'submitting' ? 'Submitting...' : 'Submit Feedback'}
                </button>
                {submissionState === 'error' && (
                    <p className="text-red-500 text-sm mt-2 text-center">{errorMessage}</p>
                )}
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                    Your feedback is anonymous and helps us improve the app.
                </p>
            </form>
        </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-6 rounded-2xl shadow-2xl w-full max-w-md relative border border-gray-200 dark:border-white/20 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
          aria-label="Close settings"
        >
          <IconX className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-brand-teal mb-6 flex items-center gap-3">
          <IconSettings className="w-7 h-7" />
          Settings
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center w-full text-left p-4 bg-gray-100 dark:bg-white/5 rounded-lg">
            <span className="font-medium">Theme</span>
            <ThemeToggle />
          </div>
          <button
            onClick={handleManageSubscription}
            className="w-full text-left p-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            Manage Subscription
          </button>
          <a
            href="mailto:savemoresuppliers@gmail.com"
            className="block w-full text-left p-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            Support
          </a>
        </div>
        {renderFeedbackSection()}
      </div>
    </div>
  );
};

export default SettingsModal;
