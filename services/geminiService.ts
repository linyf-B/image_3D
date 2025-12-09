import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

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
  prompt: string,
): Promise<string | null> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not defined. 请设置环境变量。");
  }

  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Hardcoded default model as model selection is removed
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
      if (candidate.content) { // <--- ADDED CHECK HERE for candidate.content
        for (const part of candidate.content.parts || []) {
          if (part.inlineData) {
            return part.inlineData.data;
          }
        }
      }
    }

    // If no image part is found but the request was successful, return null or throw an error based on expected behavior.
    console.warn("API response did not contain an image part.");
    return null;

  } catch (error: any) { // Use 'any' to handle potential non-Error objects from API
    console.error("Error editing image with Gemini API:", error);
    // Simplified error handling as model selection and specific API key checks for Pro model are removed
    if (error instanceof Error) {
      throw new Error(`编辑图片失败: ${error.message}`);
    }
    throw new Error("编辑图片时发生未知错误。");
  }
}

/**
 * Generates prompt suggestions based on user input and an optional template description.
 * @param currentPrompt The user's current input in the prompt textarea.
 * @param templateDescription Optional description of the selected template to provide context.
 * @returns A promise that resolves to an array of string suggestions.
 */
export async function getPromptSuggestions(
  currentPrompt: string,
  templateDescription?: string
): Promise<string[]> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not defined. 请设置环境变量。");
  }

  // Create a new GoogleGenAI instance right before making an API call.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let promptContent = `给定用户当前提示词"${currentPrompt}"，建议3个简短、可操作的短语或关键词，以增强或细化图像编辑请求。侧重于风格、光照、构图或特定物体。`;

  if (templateDescription) {
    promptContent += ` 考虑此模板的目的: "${templateDescription}"。`;
  }
  promptContent += ` 以JSON字符串数组形式返回建议，例如：["建议1", "建议2"]。`; // Corrected typo: 'Content' to 'promptContent'

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Use a text-optimized model for suggestions
      contents: promptContent,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
        temperature: 0.7, // A bit creative for suggestions
        maxOutputTokens: 200, // Limit output length
      },
    });

    const jsonStr = response.text?.trim();
    if (jsonStr) {
      // Attempt to parse the JSON string.
      // The model might sometimes return non-JSON text despite the schema.
      try {
        const suggestions = JSON.parse(jsonStr);
        if (Array.isArray(suggestions) && suggestions.every(item => typeof item === 'string')) {
          return suggestions;
        }
      } catch (parseError) {
        console.warn("Failed to parse AI suggestions as JSON array:", parseError);
        console.warn("Raw AI response for suggestions:", jsonStr);
        // Fallback: if not valid JSON array, try to extract lines as suggestions
        return jsonStr.split('\n').filter(s => s.trim() !== '').map(s => s.replace(/^- /, '').trim()).slice(0,3);
      }
    }
    return [];
  } catch (error: unknown) {
    console.error("Error getting prompt suggestions from Gemini API:", error);
    if (error instanceof Error) {
      throw new Error(`获取提示词建议失败: ${error.message}`);
    }
    throw new Error("获取提示词建议时发生未知错误。");
  }
}