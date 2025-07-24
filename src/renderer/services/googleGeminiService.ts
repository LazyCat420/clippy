interface GroundingSearchRequest {
  prompt: string;
  apiKey: string;
  model: string;
}

interface GroundingSearchResponse {
  content: string;
  groundingMetadata?: {
    webSearchQueries?: string[];
    searchQueries?: string[];
    groundingChunks?: Array<{
      segment: {
        startIndex: number;
        endIndex: number;
        text: string;
      };
      groundingChunkIndices: number[];
      confidenceScores: number[];
    }>;
  };
  renderedContent?: string;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  tools: Array<{
    google_search: {};
  }>;
  generationConfig?: {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
    stopSequences: string[];
    candidateCount: number;
  };
}

export class GoogleGeminiService {
  private static readonly BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

  static async performGroundingSearch(request: GroundingSearchRequest): Promise<GroundingSearchResponse> {
    const { prompt, apiKey, model } = request;

    const geminiRequest: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      tools: [
        {
          google_search: {},
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 10,
        topP: 0.8,
        maxOutputTokens: 2048,
        stopSequences: [],
        candidateCount: 1,
      },
    };

    try {
      const response = await fetch(`${this.BASE_URL}/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(geminiRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No response generated from Google Gemini API");
      }

      const candidate = data.candidates[0];
      
      return {
        content: candidate.content?.parts?.[0]?.text || "",
        groundingMetadata: candidate.groundingMetadata,
        renderedContent: candidate.content?.parts?.[0]?.renderedContent,
        usageMetadata: data.usageMetadata,
      };
    } catch (error) {
      console.error("Google Gemini API error:", error);
      throw error;
    }
  }

  static validateApiKey(apiKey: string): boolean {
    return apiKey && apiKey.length > 0 && (apiKey.startsWith("AIza") || apiKey.length >= 20);
  }

  static getSupportedModels(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: "gemini-2.0-flash",
        label: "Gemini 2.0 Flash",
        description: "Recommended - High request rates, good performance",
      },
      {
        value: "gemini-2.0-flash-lite",
        label: "Gemini 2.0 Flash Lite",
        description: "Fast and efficient for simple queries",
      },
      {
        value: "gemini-2.5-flash-lite",
        label: "Gemini 2.5 Flash Lite",
        description: "Latest model with improved capabilities",
      },
      {
        value: "gemini-2.5-flash",
        label: "Gemini 2.5 Flash",
        description: "Advanced model with enhanced reasoning",
      },
      {
        value: "gemini-2.5-pro",
        label: "Gemini 2.5 Pro",
        description: "Most capable model for complex tasks",
      },
      {
        value: "gemini-1.5-pro",
        label: "Gemini 1.5 Pro",
        description: "Powerful model with long context window",
      },
      {
        value: "gemini-1.5-flash",
        label: "Gemini 1.5 Flash",
        description: "Fast and efficient 1.5 model",
      },
    ];
  }
} 