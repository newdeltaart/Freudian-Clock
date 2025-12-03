import { GoogleGenAI, Type } from "@google/genai";
import { ScheduleItem } from "../types";

// Lazy initialization to prevent top-level process.env access issues during build/import
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const parseScheduleFromText = async (text: string): Promise<ScheduleItem[]> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Parse the following conference schedule text into a structured JSON array. 
      Infer start times and end times where possible. If an end time is not provided, assume it ends when the next item starts. 
      For the last item, assume a default duration of 60 minutes if not specified.
      Categorize the event type.
      
      Schedule Text:
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              startTime: { type: Type.STRING, description: "24-hour format HH:MM" },
              endTime: { type: Type.STRING, description: "24-hour format HH:MM" },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { 
                type: Type.STRING, 
                enum: ['presentation', 'break', 'workshop', 'panel', 'other'] 
              },
            },
            required: ["startTime", "title", "type"],
          },
        },
      },
    });

    const data = JSON.parse(response.text || "[]");
    
    // Add unique IDs
    return data.map((item: any, index: number) => ({
      ...item,
      id: `event-${index}-${Date.now()}`,
      endTime: item.endTime || null // Ensure null if undefined
    }));

  } catch (error) {
    console.error("Gemini parsing error:", error);
    throw new Error("Failed to parse schedule. Please check the format or try again.");
  }
};