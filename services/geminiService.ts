import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

/**
 * Edits an image using the Gemini 2.5 Flash Image model based on a text prompt.
 * @param base64Image The base64 encoded string of the original image.
 * @param mimeType The MIME type of the original image (e.g., 'image/png', 'image/jpeg').
 * @param prompt The text prompt describing the desired edit.
 * @returns A promise that resolves to the base64 encoded string of the edited image, or null if no image is returned.
 * @throws Error if the API call fails or no image is found in the response.
 */
export async function editImage(
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string | null> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not defined. Please set the environment variable.");
  }

  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Use the specified image editing model
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      // No specific config for responseMimeType or responseSchema for image models
    });

    // Iterate through all parts to find the image part, do not assume it is the first part.
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts || []) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
    }

    // If no image part is found but the request was successful, return null or throw an error based on expected behavior.
    console.warn("API response did not contain an image part.");
    return null;

  } catch (error: unknown) {
    console.error("Error editing image with Gemini API:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to edit image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while editing the image.");
  }
}
