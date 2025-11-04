import { GoogleGenAI, GenerateContentResponse, Modality } from '@google/genai';
import { PredefinedAspectRatio } from '../types';

const handleApiError = (error: unknown): string => {
  console.error("Gemini API Error:", error);
  if (error instanceof Error) {
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


export const getPromptSuggestion = async (ai: GoogleGenAI): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      // FIX: Use correct model name for gemini flash lite.
      model: 'gemini-flash-lite-latest',
      contents: 'Generate a short, creative, and visually descriptive wallpaper prompt. Be concise and inspiring. For example: "A lone astronaut contemplating a swirling nebula".',
    });

    // Clean up the response, removing quotes and extra text.
    return response.text.replace(/"/g, '').trim();
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};