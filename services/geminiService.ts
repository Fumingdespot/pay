import { GoogleGenAI, Type } from "@google/genai";
import { Tag, TagGroup, Transaction } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const suggestTags = async (
  description: string,
  groups: TagGroup[],
  tags: Tag[]
): Promise<string[]> => {
  const ai = getAiClient();
  if (!ai) return [];

  // Prepare context for the model
  const context = {
    description,
    available_tags: tags.map(t => ({
      id: t.id,
      name: t.name,
      group: groups.find(g => g.id === t.groupId)?.name
    }))
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an accounting assistant. Analyze the transaction description: "${description}".
      Select the most appropriate tag IDs from the available list. 
      Try to select one tag for each tag group if applicable (e.g. one for Scope, one for Category).
      
      Available Tags: ${JSON.stringify(context.available_tags)}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTagIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const json = JSON.parse(response.text || '{}');
    return json.suggestedTagIds || [];
  } catch (error) {
    console.error("Gemini tagging error:", error);
    return [];
  }
};

export const generateInsight = async (
  transactions: Transaction[],
  tags: Tag[]
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI Key not configured.";

  // Simplify data to save tokens
  const simplifiedData = transactions.slice(0, 50).map(t => ({
    amount: t.amount,
    desc: t.description,
    // Fix: Access tagWeights instead of non-existent tagIds
    tags: t.tagWeights.map(tw => tags.find(tag => tag.id === tw.tagId)?.name).join(', ')
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these recent transactions and give a very brief, friendly financial health summary (max 2 sentences) in Chinese. Focus on where the money is going most. Data: ${JSON.stringify(simplifiedData)}`,
    });
    return response.text || "";
  } catch (e) {
    return "Could not generate insight.";
  }
};