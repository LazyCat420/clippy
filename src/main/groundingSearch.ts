import { getLogger } from "./logger";

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
    webSources?: Array<{
      uri: string;
      title: string;
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

export class GroundingSearchService {
  private static readonly BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

  static async performGroundingSearch(request: GroundingSearchRequest): Promise<GroundingSearchResponse> {
    const { prompt, apiKey, model } = request;
    const logger = getLogger();

    // Validate API key without logging it
    if (!this.validateApiKey(apiKey)) {
      throw new Error("Invalid API key provided");
    }

    logger.info(`Performing grounding search with model: ${model}`);

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
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      // Create URL with API key (this will be in the request, not logged)
      const url = `${this.BASE_URL}/${model}:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(geminiRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Google Gemini API error: ${response.status} - ${errorText}`);
        throw new Error(`Google Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Log response summary without sensitive data
      logger.info(`Gemini API response received - candidates: ${data.candidates?.length || 0}, tokens: ${data.usageMetadata?.totalTokenCount || 'unknown'}`);
      
      if (!data.candidates || data.candidates.length === 0) {
        logger.error("No response generated from Google Gemini API");
        throw new Error("No response generated from Google Gemini API");
      }

      const candidate = data.candidates[0];
      
      // Add null checks and fallbacks
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        logger.error("Invalid response structure from Gemini API");
        throw new Error("Invalid response structure from Gemini API");
      }
      
      const firstPart = candidate.content.parts[0];
      if (!firstPart || typeof firstPart.text !== 'string') {
        logger.error("No text content in Gemini API response");
        throw new Error("No text content in Gemini API response");
      }
      
      // Extract grounding metadata safely
      const groundingMetadata = candidate.groundingMetadata || {};
      
      // Extract web sources from groundingChunks
      const webSources = groundingMetadata.groundingChunks?.map((chunk: any) => ({
        uri: chunk.web?.uri || '',
        title: chunk.web?.title || 'Unknown Source',
      })) || [];
      
      // Map the grounding chunks to our expected format
      const mappedGroundingChunks = groundingMetadata.groundingSupports?.map((support: any) => ({
        segment: support.segment,
        groundingChunkIndices: support.groundingChunkIndices || [],
        confidenceScores: support.confidenceScores || [],
      })) || [];
      
      logger.info(`Grounding search completed successfully. Tokens used: ${data.usageMetadata?.totalTokenCount || 'unknown'}`);
      
      return {
        content: firstPart.text,
        groundingMetadata: {
          webSearchQueries: groundingMetadata.webSearchQueries || [],
          searchQueries: groundingMetadata.webSearchQueries || [], // Map to both for compatibility
          groundingChunks: mappedGroundingChunks,
          webSources: webSources,
        },
        renderedContent: firstPart.renderedContent,
        usageMetadata: data.usageMetadata,
      };
    } catch (error) {
      logger.error("Google Gemini API error:", error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error("Request timed out. Please try again.");
      } else if (error.message.includes('400')) {
        throw new Error("Invalid request. Please check your API key and model selection.");
      } else if (error.message.includes('401')) {
        throw new Error("Invalid API key. Please check your Google API key.");
      } else if (error.message.includes('429')) {
        throw new Error("Rate limit exceeded. Please wait a moment and try again.");
      } else {
        throw new Error(`API request failed: ${error.message}`);
      }
    }
  }

  static validateApiKey(apiKey: string): boolean {
    // Don't log the API key, just validate it
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