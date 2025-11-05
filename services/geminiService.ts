import { GoogleGenAI, GenerateContentResponse, Modality } from '@google/genai';
import { PredefinedAspectRatio } from '../types';

const handleApiError = (error: any): string => {
  console.error("Gemini API Error:", error);

  let apiErrorDetails: { code?: number; message?: string; status?: string } | null = null;

  // Try to find the structured error details from common API error patterns
  if (error?.error && typeof error.error === 'object') {
    // Case 1: The error object is the response, e.g., { error: { ... } }
    apiErrorDetails = error.error;
  } else if (typeof error?.message === 'string' && error.message.startsWith('{')) {
    // Case 2: The error is an Error instance with a JSON string in its message
    try {
      const parsed = JSON.parse(error.message);
      // The parsed JSON could be { error: { ... } } or just { code: ..., message: ... }
      apiErrorDetails = parsed.error || parsed;
    } catch (e) {
      // Fallback to using the raw message if JSON parsing fails
      return `An error occurred: ${error.message}`;
    }
  }

  // If we found structured details, format a specific message
  if (apiErrorDetails && typeof apiErrorDetails === 'object') {
    if (apiErrorDetails.status === 'RESOURCE_EXHAUSTED' || apiErrorDetails.code === 429) {
      return "You've exceeded your request limit. Please wait a moment and try again, or check your API plan and billing details at ai.google.dev.";
    }
    if (apiErrorDetails.message) {
      return `An API error occurred: ${apiErrorDetails.message}`;
    }
  }

  // Fallback for standard Error objects or unknown structures
  if (error?.message) {
    return `An error occurred: ${error.message}`;
  }

  return 'An unknown error occurred while contacting the Gemini API.';
};

export const generateImage = async (ai: GoogleGenAI, prompt: string, aspectRatio: PredefinedAspectRatio): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio,
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages[0].image.imageBytes;
    }
    throw new Error('No image was generated. The prompt might have been blocked.');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const editImage = async (ai: GoogleGenAI, prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error('No edited image was returned. The prompt might have been blocked.');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const reimagineImageRegion = async (ai: GoogleGenAI, imageBase64: string, mimeType: string, maskBase64: string, prompt: string): Promise<string> => {
  try {
    const fullPrompt = `Using the provided mask, reimagine the selected area of the original image to be: "${prompt}". The rest of the image should remain unchanged.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { inlineData: { data: maskBase64, mimeType: 'image/png' } },
          { text: fullPrompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error('Could not reimagine the image region. The model might have returned an empty response.');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};


export const analyzeImage = async (ai: GoogleGenAI, prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt },
        ],
      },
    });

    return response.text;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const upscaleImage = async (ai: GoogleGenAI, imageBase64: string, mimeType: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: "Upscale this image, enhancing details and increasing resolution without changing the content or aspect ratio." },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error('Could not upscale the image. The model might have returned an empty response.');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};