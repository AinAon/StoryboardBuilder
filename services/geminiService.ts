import { GoogleGenAI } from "@google/genai";
import { AspectRatio, GeminiModel, StoryboardItem } from "../types";

function getApiKey(): string {
  // Standalone deployment: key stored in window by App.tsx
  const key = (window as any).__GEMINI_API_KEY__ || (process as any)?.env?.API_KEY || '';
  if (!key) throw new Error('No API key configured');
  return key;
}

export async function generateSketchImage(
  prompt: string,
  model: GeminiModel,
  ratio: AspectRatio,
  previousItems: StoryboardItem[]
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const storyHistory = previousItems
    .filter(item => item.context.trim() !== '')
    .map(item => `Cut #${item.cutNumber}: ${item.context}`)
    .join('\n');

  const contextBlock = storyHistory
    ? `\n\nSTORY CONTEXT SO FAR:\n${storyHistory}\n\nMaintain visual consistency with these previous scenes.`
    : "";

  const enhancedPrompt = `A clean, professional pencil sketch storyboard illustration showing: ${prompt}. ${contextBlock}
  Style: Minimalist line art, black and white, high contrast, focused strictly on composition. 
  CRITICAL: Do not include any text, letters, numbers, labels, markings, or watermarks. Visual only.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: enhancedPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: ratio as any,
          imageSize: "1K"
        }
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("Invalid response structure from Gemini API");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response");
  } catch (error: any) {
    if (error?.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_INVALID");
    }
    console.error("Image generation failed:", error);
    throw error;
  }
}
