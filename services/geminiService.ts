
import { GoogleGenAI } from "@google/genai";
import { GeneratorState } from "../types";

// Initialize the client
// API Key must be in process.env.API_KEY
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Retries a promise-based function with exponential backoff.
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (maxRetries <= 0) throw error;
    
    // Check for specific retryable errors if needed (e.g., 503, 429)
    console.warn(`Operation failed, retrying in ${delayMs}ms...`, error);
    
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return retryOperation(operation, maxRetries - 1, delayMs * 2);
  }
}

/**
 * Generates a single thumbnail based on the state.
 * Returns the base64 image string.
 */
export const generateSingleImage = async (state: GeneratorState): Promise<string> => {
  // Always get a fresh client to ensure latest API key is used
  const ai = getClient();

  // 1. Construct the detailed text prompt
  let prompt = `Role: Expert YouTube Thumbnail Designer.
  Task: Create a high-engagement composite thumbnail based on the following specifications.
  
  COMPOSITION DETAILS:
  - Aspect Ratio: ${state.aspectRatio}
  - Style: ${state.stylePreset}
  - Main Scene Description: ${state.mainPrompt}
  - Background Environment: ${state.backgroundPrompt}
  
  TEXT OVERLAY:
  - Text content: "${state.headlineText}"
  - Text Style: Render this text explicitly in the image. Use a bold, high-contrast font with a thick outline and shadow to ensure readability on small screens. Place it strategically (usually top or center) to not obscure faces.
  
  ACTOR/SUBJECT INSTRUCTIONS:
  `;

  if (state.actors.length > 0) {
    prompt += `\nI have provided ${state.actors.length} image(s) of actors/subjects. You MUST:
    1. Crop the subject from their original background.
    2. Place them into the generated background scene seamlessly.
    3. Apply the requested lighting to match the environment.
    4. Adjust their expression if possible or emphasize the existing emotion.
    `;
    state.actors.forEach((actor, index) => {
      prompt += `\n- Actor ${index + 1}: Requested Emotion/Action: "${actor.emotion}". Place prominently in the composition.`;
    });
  } else {
    prompt += `\nNo specific actor images provided. Generate a suitable subject based on the main scene description.`;
  }

  if (state.references.length > 0) {
    prompt += `\n\nREFERENCE MATERIAL:
    I have provided ${state.references.length} reference image(s). Use them for inspiration regarding color palette, lighting, and composition layout.`;
  }

  // 2. Build the contents array
  const parts: any[] = [{ text: prompt }];

  // Add References
  state.references.forEach((ref) => {
    parts.push({
      inlineData: {
        mimeType: ref.mimeType,
        data: ref.base64Data,
      },
    });
  });

  // Add Actors
  state.actors.forEach((actor) => {
    parts.push({
      inlineData: {
        mimeType: actor.mimeType,
        data: actor.base64Data,
      },
    });
  });

  // 3. Configure API
  const modelId = state.modelId || 'gemini-2.5-flash-image'; 

  const config: any = {
      imageConfig: {
          aspectRatio: state.aspectRatio,
      }
  };

  // Add specific config if using Gemini 3 Pro Image
  if (modelId === 'gemini-3-pro-image-preview') {
      config.imageConfig.imageSize = state.imageResolution || '1K';
  }

  const performRequest = async () => {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: { parts },
        config: config
      });

      // 4. Parse Response
      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error("No candidates returned from Gemini.");
      }

      const content = candidates[0].content;
      
      // Check for inlineData (Generated Image)
      const imagePart = content.parts.find((part: any) => part.inlineData);
      
      if (imagePart && imagePart.inlineData) {
          return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      }

      // If no image, check text for error message
      const textPart = content.parts.find((part: any) => part.text);
      if (textPart) {
          throw new Error(`Model returned text instead of image: ${textPart.text}`);
      }

      throw new Error("Unexpected response format: No image data found.");
  };

  return retryOperation(performRequest);
};
