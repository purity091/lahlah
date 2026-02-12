
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Task } from "../types";

export class GeminiService {
  async generateTasks(contextName: string, contextDescription: string, userMessage?: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-pro-preview';
    const prompt = `
      السياق الحالي: ${contextName}
      الوصف: ${contextDescription}
      طلب المستخدم: ${userMessage || "اقترح مهام لهذا السياق بناءً على أهدافي."}
      
      يرجى إنشاء قائمة بالمهام المقترحة بتنسيق JSON. تأكد من تحديد تاريخ لكل مهمة بصيغة YYYY-MM-DD.
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    category: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    date: { type: Type.STRING, description: "YYYY-MM-DD format" },
                    suggestedTime: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                  },
                  required: ["title", "category", "priority", "date", "suggestedTime", "duration", "rationale"]
                }
              }
            },
            required: ["tasks"]
          }
        }
      });

      const jsonStr = response.text.trim();
      const parsed = JSON.parse(jsonStr);
      return (parsed.tasks || []).map((t: any) => ({
        ...t,
        id: Math.random().toString(36).substr(2, 9),
        completed: false
      }));
    } catch (error) {
      console.error("Gemini API Error:", error);
      return [];
    }
  }

  async analyzeGlobalStrategy(allTasks: Task[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-pro-preview';

    const tasksSummary = allTasks.map(t => `- [${t.contextId}] ${t.title} (${t.date} ${t.suggestedTime})`).join('\n');

    const prompt = `
    بصفتك كبير مهندسين ومدير منتجات استراتيجي، حلل قائمة المهام الشاملة لمحمد لحلح:
    
    ${tasksSummary}
    
    المطلوب تحليل JSON يحتوي على:
    1. "conflicts": مصفوفة من التعارضات الزمنية أو الاستراتيجية المكتشفة.
    2. "missedOpportunities": مهام مفقودة أو جوانب تم إهمالها (مثلاً: إهمال الصحة لصالح العمل).
    3. "strategicBrainstorm": أفكار لربط المنتجات معاً (Synergy).
    4. "dailyFocus": النصيحة الذهبية لليوم.
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              conflicts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
                  }
                }
              },
              missedOpportunities: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              strategicBrainstorm: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              dailyFocus: { type: Type.STRING }
            }
          }
        }
      });
      return JSON.parse(response.text.trim());
    } catch (error) {
      console.error("Global Analysis Error:", error);
      return null;
    }
  }

  async parseQuickTask(input: string, contextName: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    const prompt = `حلل النص التالي بعناية. إذا كان يحتوي على عدة التزامات أو أفكار، قم بتقسيمها إلى مهام مستقلة ومنطقية: "${input}"
    السياق: ${contextName}
    التاريخ اليوم: ${new Date().toISOString().split('T')[0]}
    
    القواعد:
    1. تقسيم النص إلى أصغر وحدات عمل ممكنة (Atomic Tasks).
    2. استنتاج الوقت والتاريخ المناسب لكل مهمة.
    3. إذا لم يذكر تاريخ، افترض أنه اليوم أو غداً بناءً على السياق.
    
    يجب أن يكون الناتج عبارة عن مصفوفة (Array) من المهام بتنسيق JSON.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    category: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    date: { type: Type.STRING },
                    suggestedTime: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                  },
                  required: ["title", "category", "priority", "date", "suggestedTime", "duration", "rationale"]
                }
              }
            },
            required: ["suggestions"]
          }
        }
      });
      const data = JSON.parse(response.text.trim());
      return (data.suggestions || []).map((task: any) => ({
        ...task,
        id: Math.random().toString(36).substr(2, 9),
        completed: false
      }));
    } catch (error) {
      console.error("Parse Quick Task Error:", error);
      return [];
    }
  }

  async getChatResponse(contextName: string, history: { role: string, content: string }[], message: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    const contents = history.map(h => ({
      role: h.role,
      parts: [{ text: h.content }]
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    try {
      const response = await ai.models.generateContent({
        model,
        contents: contents as any,
        config: {
          systemInstruction: `${SYSTEM_INSTRUCTION}\nأنت الآن تتحدث ضمن سياق: ${contextName}. ركز إجابتك على هذا السياق وتذكر ملف محمد لحلح الشخصي.`,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return "عذراً، حدث خطأ أثناء معالجة طلبك.";
    }
  }
}
