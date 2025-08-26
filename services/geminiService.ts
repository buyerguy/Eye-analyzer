
import { GoogleGenAI, Type } from "@google/genai";
import type { IrisAnalysis } from '../types';
import { logger } from './logger';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    ancestry: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A creative title for the ancestry/ethnicity guess. e.g., 'Northern European Whispers'" },
        description: { type: Type.STRING, description: "A 1-2 sentence fun guess about likely ancestral regions based on iris color and patterns. e.g., 'The light blue color and distinct rings are often seen in populations from Northern Europe, like Scandinavia or the British Isles.'" },
        metrics: {
            type: Type.OBJECT,
            description: "Fun, plausible-sounding metrics related to the ancestry guess.",
            properties: {
                globalPrevalence: { type: Type.STRING, description: "Estimated global prevalence as a percentage string, e.g., '9%'." },
                regionalHotspots: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 1-2 likely regional hotspots, e.g., ['Northern Europe']." },
                geneticProbability: { type: Type.STRING, description: "A fun, fictional genetic probability ratio, e.g., '1:15'." },
            },
            required: ['globalPrevalence', 'regionalHotspots', 'geneticProbability']
        }
      },
      required: ['title', 'description', 'metrics']
    },
    healthClues: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A creative title for health risk clues. e.g., 'Sunlight Sensitivity'" },
        description: { type: Type.STRING, description: "A 1-2 sentence non-medical suggestion about UV sensitivity or light reactivity based ONLY on eye color. e.g., 'Lighter-colored eyes have less pigment to protect against UV rays, so wearing sunglasses is a great idea.'" }
      },
      required: ['title', 'description']
    },
    biometricSignature: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A creative title for the biometric signature. e.g., 'A Unique Encryption Key'" },
        description: { type: Type.STRING, description: "A 1-2 sentence comment on the uniqueness of the iris pattern as a biometric identifier. e.g., 'Your iris pattern, with its intricate network of furrows and ridges, is completely unique to you—more so than a fingerprint!'" }
      },
      required: ['title', 'description']
    },
    rarityIndex: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A creative title for the rarity index. e.g., 'Global Rarity Meter'" },
        percentage: { type: Type.INTEGER, description: "An integer from 1 to 100 representing how common this eye color is globally (1=very rare, 100=very common)." },
        description: { type: Type.STRING, description: "A 1-2 sentence explanation of the rarity of the eye color-pattern combination. e.g., 'Blue eyes are found in about 8-10% of the world's population, making them relatively uncommon compared to brown eyes.'" }
      },
      required: ['title', 'percentage', 'description']
    },
    personalityVibe: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A fun, pseudoscience-based personality label. e.g., 'Strategic Thinker'" },
        description: { type: Type.STRING, description: "A 1-2 sentence lighthearted personality trait associated with the eye color. e.g., 'People with blue eyes are often perceived as being intellectual, charming, and possessing a vibrant inner world.'" }
      },
      required: ['title', 'description']
    },
    pigmentOddities: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A title for pigment oddities found. e.g., 'Central Heterochromia' or 'Uniform Canvas'" },
        description: { type: Type.STRING, description: "A 1-2 sentence note on any detected traits like central heterochromia, rings, or freckles. If none, comment on the uniformity. e.g., 'A distinct golden ring surrounds your pupil, a trait known as central heterochromia, adding a beautiful, fiery contrast!'" }
      },
      required: ['title', 'description']
    },
    healthIndicators: {
        type: Type.ARRAY,
        description: "A list of 2-4 non-medical, entertainment-focused 'health indicators' based on common iridology patterns like stress rings, etc. ABSOLUTELY NO MEDICAL ADVICE. Frame descriptions carefully. e.g., 'Potential Fatigue', 'Stress Levels'.",
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "The name of the indicator, e.g., 'Stress Levels'." },
                description: { type: Type.STRING, description: "A 1-2 sentence fun, non-medical observation. e.g., 'The presence of faint concentric rings, sometimes called stress rings, may suggest the body has been under pressure.'" },
                level: { type: Type.STRING, description: "A qualitative assessment, e.g., 'Low', 'Moderate', 'High', 'Normal'." }
            },
            required: ['name', 'description', 'level']
        }
    },
    uniquePatterns: {
        type: Type.ARRAY,
        description: "A list of 1-3 unique structural patterns detected in the iris (e.g., Concentric Rings, Radiant Crypts). Provide a name and a short, fun description for each.",
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "The name of the unique pattern, e.g., 'Radiant Crypts'." },
                description: { type: Type.STRING, description: "A 1-2 sentence fun explanation of what this pattern is and what it might imply in a non-medical, entertaining way." }
            },
            required: ['name', 'description']
        }
    },
    dominantColor: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "The primary eye color name, e.g., 'Blue-Green'." },
          confidence: { type: Type.INTEGER, description: "A confidence score (0-100) for the dominant color." },
          hexCode: { type: Type.STRING, description: "The hex code for the dominant color, e.g., '#3d9a8b'." }
        },
        required: ['name', 'confidence', 'hexCode']
    },
    colorComposition: {
        type: Type.ARRAY,
        description: "A breakdown of the top 3-4 colors found in the iris.",
        items: {
          type: Type.OBJECT,
          properties: {
            colorName: { type: Type.STRING, description: "Name of the color component." },
            hexCode: { type: Type.STRING, description: "The hex code for the color." },
            percentage: { type: Type.INTEGER, description: "The percentage of this color in the composition." }
          },
          required: ['colorName', 'hexCode', 'percentage']
        }
    }
  },
  required: ['ancestry', 'healthClues', 'biometricSignature', 'rarityIndex', 'personalityVibe', 'pigmentOddities', 'healthIndicators', 'uniquePatterns', 'dominantColor', 'colorComposition']
};

const processImage = (imageDataUrl: string, maxDimension: number = 1024): Promise<{ resizedB64: string, originalSize: number, newSize: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = imageDataUrl;
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > height) {
                if (width > maxDimension) {
                    height = Math.round(height * (maxDimension / width));
                    width = maxDimension;
                }
            } else {
                if (height > maxDimension) {
                    width = Math.round(width * (maxDimension / height));
                    height = maxDimension;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error("Could not get canvas context for image processing."));
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            
            const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            const resizedBase64 = resizedDataUrl.split(',')[1];
            
            resolve({
                resizedB64: resizedBase64,
                originalSize: imageDataUrl.length,
                newSize: resizedDataUrl.length
            });
        };

        img.onerror = () => {
            reject(new Error("Failed to load image for processing. It might be a non-standard format or corrupted."));
        };
    });
};

export const createThumbnailDataUrl = (imageDataUrl: string, maxDimension: number = 200): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = imageDataUrl;
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > height) {
                if (width > maxDimension) {
                    height = Math.round(height * (maxDimension / width));
                    width = maxDimension;
                }
            } else {
                if (height > maxDimension) {
                    width = Math.round(width * (maxDimension / height));
                    height = maxDimension;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error("Could not get canvas context for thumbnail generation."));
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            
            const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            resolve(resizedDataUrl);
        };

        img.onerror = () => {
            reject(new Error("Failed to load image for thumbnail generation."));
        };
    });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeIrisImage = async (
    imageDataUrl: string, 
    setStatus: (status: string) => void
): Promise<IrisAnalysis> => {
  logger.info('Starting iris analysis request.');
  setStatus('Validating image data...');

  if (!imageDataUrl || !imageDataUrl.startsWith('data:image')) {
    const errorMsg = 'Invalid image data URL provided. It might be empty or not a proper image file.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  let processedImageBase64: string;
  try {
    setStatus('Processing image (resizing & compressing)...');
    const { resizedB64, originalSize, newSize } = await processImage(imageDataUrl);
    processedImageBase64 = resizedB64;
    logger.info('Image processed successfully.', { originalSize, newSize });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred during image processing.';
    logger.error('Image processing failed.', { error: errorMsg });
    throw new Error(`Image processing failed: ${errorMsg}`);
  }

  // **CRUCIAL VALIDATION ADDED HERE**
  if (!processedImageBase64 || typeof processedImageBase64 !== 'string' || processedImageBase64.length < 500) { // 500 is a safe low-end heuristic for a tiny jpeg
    const errorMsgForLog = 'Image processing resulted in empty or invalid data. This can happen with corrupted files or unsupported formats on mobile devices.';
    const errorMsgForUser = 'The selected image could not be processed correctly. This can happen with screenshots or images from unsupported apps.\n\nFor a guaranteed result, please try again with a different photo or use the "Use Camera" option.';
    
    logger.error(errorMsgForLog, { 
      base64Preview: processedImageBase64?.substring(0, 50) + '...', 
      base64Length: processedImageBase64?.length 
    });
    
    setStatus('Image validation failed.');
    throw new Error(errorMsgForUser);
  }


  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: processedImageBase64,
    },
  };

  const textPart = {
    text: `Analyze the iris in this high-quality image. Your analysis MUST be based ONLY on the visible iris color and pattern. Do not analyze the pupil, sclera, retina, or any surrounding skin or eyelashes.
    Your tone must be engaging, fun, and educational. Do NOT provide any medical advice. This is for entertainment.
    Based on the iris, provide a fun analysis covering the requested categories.
    For the ancestry section, include a 'metrics' object with fun but plausible-sounding data for globalPrevalence, regionalHotspots, and geneticProbability.
    Identify 1-3 unique iris patterns like 'Concentric Rings', 'Radiant Furrows', 'Crypts of Fuchs', etc. and provide a fun explanation for each.
    Determine the dominant color (with confidence score and hex code) and a breakdown of the color composition (top 3-4 colors with names, hex codes, and percentages).
    Crucially, identify 2-4 non-medical 'health indicators' based on common iridology patterns (like stress rings for stress, or radial furrows for fatigue). Frame these as fun observations, NOT medical diagnoses. For example, 'Potential Fatigue' or 'Stress Levels'. Provide a name, a cautious description, and a level (Low, Moderate, High, or Normal) for each.
    Fill out all fields in the provided JSON schema with creative and relevant content.
    `
  };
  
  const contents = [{ parts: [imagePart, textPart] }];

  const requestPayload = {
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
  };

  // Comprehensive validation and logging
  const firstContent = requestPayload.contents[0];
  const imagePayloadPart = firstContent.parts.find(p => 'inlineData' in p);

  if (!imagePayloadPart || !('inlineData' in imagePayloadPart) || !imagePayloadPart.inlineData.data) {
      const validationError = 'Client-side validation failed: Image data is missing from the final request payload.';
      logger.error(validationError, { payloadShape: { hasContent: !!firstContent, hasParts: !!firstContent?.parts, hasImagePart: !!imagePayloadPart, hasData: !!(imagePayloadPart && 'inlineData' in imagePayloadPart && imagePayloadPart.inlineData.data) } });
      throw new Error(validationError);
  }

  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      setStatus(`Contacting AI service (attempt ${attempt + 1}/${MAX_RETRIES})...`);
      
      // **DETAILED PAYLOAD LOGGING ADDED HERE**
      const logPayload = {
        model: requestPayload.model,
        config: requestPayload.config,
        contents: [
            {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: `(base64 data, length: ${imagePayloadPart.inlineData.data.length})` } },
                    { text: textPart.text.substring(0, 150) + '...' }
                ]
            }
        ]
      };
      logger.info(`Sending request to Gemini API (Attempt ${attempt + 1}/${MAX_RETRIES})`, { requestPayload: logPayload });

      const response = await ai.models.generateContent(requestPayload);

      setStatus('Parsing AI response...');
      const jsonText = response.text;
      const analysisResult = JSON.parse(jsonText) as IrisAnalysis;

      if (!analysisResult.rarityIndex || typeof analysisResult.rarityIndex.percentage !== 'number' || !analysisResult.dominantColor || !analysisResult.uniquePatterns || !analysisResult.healthIndicators) {
          throw new Error("Invalid or incomplete analysis data received from AI.");
      }
      
      setStatus('Analysis complete!');
      logger.info('Analysis successful.');
      return analysisResult;
    } catch(e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      logger.error(`API call attempt ${attempt + 1} failed.`, { error: errorMessage });

      if (attempt + 1 >= MAX_RETRIES) {
          throw new Error(`AI service failed after ${MAX_RETRIES} attempts. Final error: ${errorMessage}`);
      }

      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
      logger.warn(`Retrying in ${delay}ms...`);
      setStatus(`AI service failed. Retrying in ${delay / 1000}s...`);
      await sleep(delay);
    }
  }

  // Fallback error, should not be reached in normal flow
  throw new Error("Analysis failed after multiple retries.");
};