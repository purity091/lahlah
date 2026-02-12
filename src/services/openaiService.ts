import OpenAI from 'openai';
import { SYSTEM_INSTRUCTION, CONTEXTS } from "../constants";
import { Task } from "../types";

export class OpenAIService {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({
            apiKey: import.meta.env.VITE_OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
            dangerouslyAllowBrowser: true // Note: In production, API calls should go through a backend
        });
    }

    private getCacheKey(prefix: string, data: any): string {
        return `lahlah_cache_${prefix}_${JSON.stringify(data)}`;
    }

    private getFromCache<T>(key: string): T | null {
        const cached = localStorage.getItem(key);
        if (cached) {
            console.log(`[Cache Hit] Serving from cache: ${key}`);
            return JSON.parse(cached);
        }
        return null;
    }

    private saveToCache(key: string, data: any) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn("Failed to save to cache (quota exceeded?)", e);
        }
    }

    async generateTasks(activeContext: any, userMessage?: string) {
        const cacheKey = this.getCacheKey('tasks', { contextName: activeContext.name, userMessage });
        const cached = this.getFromCache<any[]>(cacheKey);
        if (cached) return cached;

        let extraContext = "";
        if (activeContext) {
            extraContext = `
            تفاصيل إضافية للمشروع:
            - الأهداف الاستراتيجية: ${activeContext.strategicGoals?.join(', ') || 'غير محدد'}
            - الحالة الحالية: ${activeContext.currentPhase || 'غير محدد'}
            - التقنيات المستخدمة: ${activeContext.techStack?.join(', ') || 'غير محدد'}
            - الجمهور المستهدف: ${activeContext.targetAudience || 'غير محدد'}
            `;
        }

        const prompt = `
      السياق الحالي: ${activeContext.name}
      الوصف: ${activeContext.description}
      ${extraContext}
      طلب المستخدم: ${userMessage || "اقترح مهام لهذا السياق بناءً على أهدافي."}
      
      المهمة: قم بإنشاء قائمة بالمهام المقترحة.
      يجب أن يكون الرد بصيغة JSON فقط وتتبع الهيكل التالي تماماً:
      {
        "tasks": [
          {
            "title": "string",
            "category": "string",
            "priority": "High" | "Medium" | "Low",
            "date": "YYYY-MM-DD",
            "suggestedTime": "HH:MM AM/PM",
            "duration": "e.g. 1 hour",
            "rationale": "string"
          }
        ]
      }
      تأكد من تحديد تاريخ لكل مهمة بصيغة YYYY-MM-DD.
    `;

        try {
            const response = await this.client.chat.completions.create({
                model: "gpt-4-turbo-preview", // or gpt-3.5-turbo if preferred for cost
                messages: [
                    { role: "system", content: SYSTEM_INSTRUCTION },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            if (!content) return [];

            const parsed = JSON.parse(content);
            const tasks = (parsed.tasks || []).map((t: any) => ({
                ...t,
                id: Math.random().toString(36).substr(2, 9),
                completed: false
            }));

            this.saveToCache(cacheKey, tasks);
            return tasks;
        } catch (error) {
            console.error("OpenAI API Error:", error);
            return [];
        }
    }

    async analyzeGlobalStrategy(allTasks: Task[]) {
        // Create a hash of task IDs and their status/update times to detect changes
        const tasksFingerprint = allTasks.map(t => `${t.id}-${t.status}`).join('|');
        const cacheKey = this.getCacheKey('global_analysis', tasksFingerprint);

        const cached = this.getFromCache<any>(cacheKey);
        if (cached) return cached;

        const tasksSummary = allTasks.map(t => `- [${t.contextId}] ${t.title} (${t.date} ${t.suggestedTime})`).join('\n');

        const prompt = `
    بصفتك كبير مهندسين ومدير منتجات استراتيجي، حلل قائمة المهام الشاملة لمحمد لحلح:
    
    ${tasksSummary}
    
    المطلوب تحليل JSON يحتوي على:
    {
      "conflicts": [{"title": "string", "description": "string", "severity": "High" | "Medium" | "Low"}],
      "missedOpportunities": ["string"],
      "strategicBrainstorm": ["string"],
      "dailyFocus": "string"
    }
    `;

        try {
            const response = await this.client.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    { role: "system", content: SYSTEM_INSTRUCTION },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            const result = content ? JSON.parse(content) : null;

            if (result) {
                this.saveToCache(cacheKey, result);
            }
            return result;
        } catch (error) {
            console.error("Global Analysis Error:", error);
            return null;
        }
    }

    async parseQuickTask(input: string, contextName: string) {
        const cacheKey = this.getCacheKey('quick_task_parse', { input, contextName });
        const cached = this.getFromCache<any[]>(cacheKey);
        if (cached) return cached;

        const prompt = `حلل النص التالي بعناية (النص قد يكون بالعامية أو الفصحى، لكن المخرج يجب أن يكون بالفصحى).
    النص: "${input}"
    السياق: ${contextName}
    التاريخ اليوم: ${new Date().toISOString().split('T')[0]}
    
    القواعد:
    1. تقسيم النص إلى أصغر وحدات عمل ممكنة (Atomic Tasks).
    2. استنتاج الوقت والتاريخ المناسب لكل مهمة.
    3. إذا لم يذكر تاريخ، افترض أنه اليوم أو غداً بناءً على السياق.
    4. "title" يجب أن يكون باللغة العربية الفصحى وواضحاً جداً.
    5. "rationale" هو سبب اختيار هذه المهمة، ويجب أن يكون بالعربية.
    
    يجب أن يكون الناتج JSON بالشكل:
    {
      "suggestions": [
        {
          "title": "string (Arabic)",
          "category": "string (e.g., Development, Planning)",
          "priority": "string (High/Medium/Low)",
          "date": "YYYY-MM-DD",
          "suggestedTime": "HH:MM AM/PM",
          "duration": "string (e.g. 30 mins)",
          "rationale": "string (Arabic)"
        }
      ]
    }`;

        try {
            const response = await this.client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: SYSTEM_INSTRUCTION },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            if (!content) return [];

            const parsed = JSON.parse(content);
            const suggestions = (parsed.suggestions || []).map((task: any) => ({
                ...task,
                id: Math.random().toString(36).substr(2, 9),
                completed: false
            }));

            this.saveToCache(cacheKey, suggestions);
            return suggestions;
        } catch (error) {
            console.error("Parse Quick Task Error:", error);
            return [];
        }
    }

    async getChatResponse(activeContext: any, history: { role: string, content: string }[], message: string) {
        const cacheKey = this.getCacheKey('chat', { contextName: activeContext.name, history, message });
        const cached = this.getFromCache<string>(cacheKey);
        if (cached) return cached;

        const formattedHistory = history.map(h => ({
            role: h.role as "user" | "assistant" | "system",
            content: h.content
        }));

        // Map 'model' role to 'assistant' for OpenAI
        const openAIHistory = formattedHistory.map(h => ({
            role: h.role === 'model' ? 'assistant' : h.role, // Fix types
            content: h.content
        }));

        // Quick fix for type safety in map above since 'model' isn't in OpenAI types
        const safeHistory = history.map(h => ({
            role: (h.role === 'model' ? 'assistant' : h.role) as "user" | "assistant",
            content: h.content
        }));

        try {
            let extraContext = "";
            if (activeContext) {
                extraContext = `
                معلومات هامة عن هذا السياق:
                - الحالة: ${activeContext.currentPhase || 'غير محدد'}
                - التقنيات: ${activeContext.techStack?.join(', ') || 'غير محدد'}
                - الأهداف: ${activeContext.strategicGoals?.join(', ') || 'غير محدد'}
                - المميزات الرئيسية: ${activeContext.keyFeatures?.join(', ') || 'غير محدد'}
                `;
            }

            const response = await this.client.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    { role: "system", content: `${SYSTEM_INSTRUCTION}\nأنت الآن تتحدث ضمن سياق: ${activeContext.name}.\n${extraContext}\nركز إجابتك على هذا السياق وتذكر ملف محمد لحلح الشخصي.` },
                    ...safeHistory,
                    { role: "user", content: message }
                ]
            });

            const content = response.choices[0].message.content || "عذراً، لم أستطع توليد إجابة.";
            this.saveToCache(cacheKey, content);
            return content;
        } catch (error) {
            console.error("OpenAI Chat Error:", error);
            return "عذراً، حدث خطأ أثناء معالجة طلبك.";
        }
    }
    async generatePRD(activeContext: any, featureTitle: string, featureDescription: string) {
        const cacheKey = this.getCacheKey('prd', { context: activeContext.name, featureTitle, featureDescription });
        const cached = this.getFromCache<any>(cacheKey);
        if (cached) return cached;

        const prompt = `
        Context: ${activeContext.name} (${activeContext.description})
        Product Phase: ${activeContext.currentPhase}
        Strategic Goals: ${activeContext.strategicGoals?.join(', ')}
        
        Task: Create a professional Product Requirements Document (PRD) for a new feature: "${featureTitle}".
        Feature Description: ${featureDescription}

        Output JSON format required:
        {
            "problemStatement": "Clear description of the problem this feature solves",
            "goals": ["measurable goal 1", "measurable goal 2"],
            "userStories": ["As a [user], I want to [action] so that [benefit]"],
            "acceptanceCriteria": ["Criteria 1", "Criteria 2"],
            "techNotes": "High-level technical implementation details and considerations"
        }
        
        Language: Arabic (Professional/Technical).
        `;

        try {
            const response = await this.client.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    { role: "system", content: SYSTEM_INSTRUCTION },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            const result = content ? JSON.parse(content) : null;

            if (result) {
                this.saveToCache(cacheKey, result);
            }
            return result;
        } catch (error) {
            console.error("PRD Generation Error:", error);
            return null;
        }
    }

    async generateDiscoveryArtifact(activeContext: any, type: 'Interview' | 'Experiment', focus: string) {
        const cacheKey = this.getCacheKey('discovery', { context: activeContext.id, type, focus });
        const cached = this.getFromCache<any>(cacheKey);
        if (cached) return cached;

        const prompt = `
        Context: ${activeContext.name}
        Strategy: ${activeContext.strategicGoals?.join(', ')}
        Task: Create a professional Product Discovery artifact.
        Type: ${type === 'Interview' ? 'User Interview Script' : 'Validation Experiment/Smoke Test'}
        Focus: ${focus}

        Output JSON format:
        {
          "targetAudience": "Specific segment to target",
          "objectives": ["Goal 1", "Goal 2"],
          "questionsOrSteps": ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"],
          "hypotheses": ["If we [action], then [result]"],
          "successCriteria": ["Metric 1", "Metric 2"]
        }
        
        Language: Arabic (Professional).
        `;

        try {
            const response = await this.client.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    { role: "system", content: SYSTEM_INSTRUCTION },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            const result = content ? JSON.parse(content) : null;
            if (result) this.saveToCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error("Discovery Generation Error:", error);
            return null;
        }
    }

    async transcribeAudio(audioFile: File): Promise<string> {
        try {
            const response = await this.client.audio.transcriptions.create({
                file: audioFile,
                model: "whisper-1",
                language: "ar", // Set language to Arabic
            });
            return response.text;
        } catch (error) {
            console.error("Whisper Transcription Error:", error);
            return "";
        }
    }
}
