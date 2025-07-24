import React from "react";

// Simple markdown formatter for basic formatting
const formatMarkdownContent = (content: string): string => {
  return content
    // Convert **text** to bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert *text* to italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Convert bullet points to proper formatting
    .replace(/^\* (.*)/gm, '• $1')
    // Convert double line breaks to paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Wrap in paragraph tags
    .replace(/^(.+)$/gm, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    // Remove extra paragraph wrapping
    .replace(/<p><p>/g, '<p>')
    .replace(/<\/p><\/p>/g, '</p>');
};

interface GroundingSearchResultProps {
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
}

export const GroundingSearchResult: React.FC<GroundingSearchResultProps> = ({
  content,
  groundingMetadata,
  renderedContent,
}) => {
  // Add safety checks
  if (!content) {
    return <div>No content available</div>;
  }

  const searchQueries = groundingMetadata?.webSearchQueries || groundingMetadata?.searchQueries || [];

  return (
    <div style={{ marginTop: "10px" }}>
      {/* Display the main content */}
      <div style={{ marginBottom: "10px" }}>
        {renderedContent ? (
          <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
        ) : (
          <div 
            style={{ 
              lineHeight: "1.6",
            }}
            dangerouslySetInnerHTML={{ __html: formatMarkdownContent(content) }}
          />
        )}
      </div>

      {/* Display search queries as chips */}
      {searchQueries.length > 0 && (
        <div style={{ marginTop: "15px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
            Search queries used:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {searchQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => {
                  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                  window.open(searchUrl, "_blank");
                }}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#f0f0f0",
                  border: "1px solid #ccc",
                  borderRadius: "16px",
                  fontSize: "12px",
                  cursor: "pointer",
                  color: "#333",
                  textDecoration: "none",
                  display: "inline-block",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e0e0e0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f0f0f0";
                }}
              >
                🔍 {query}
              </button>
            ))}
          </div>
        </div>
      )}

                   {/* Display grounding information */}
             {groundingMetadata?.groundingChunks && groundingMetadata.groundingChunks.length > 0 && (
               <div style={{ marginTop: "15px", fontSize: "12px", color: "#666" }}>
                 <div style={{ marginBottom: "5px" }}>
                   <strong>Grounding Information:</strong>
                 </div>
                 <div>
                   {groundingMetadata.groundingChunks.map((chunk, index) => {
                     // Get the source information from groundingChunkIndices
                     const sourceIndices = chunk.groundingChunkIndices || [];
                     const sources = sourceIndices.map(idx => {
                       // Get the actual web source from the webSources array
                       const webSources = groundingMetadata.webSources || [];
                       if (idx < webSources.length) {
                         return webSources[idx];
                       }
                       return { uri: `#source-${idx}`, title: `Source ${idx + 1}` };
                     });
                     
                     return (
                       <div key={index} style={{ marginBottom: "8px" }}>
                         <div style={{ color: "#0066cc", marginBottom: "2px" }}>
                           "{chunk.segment?.text || 'No text available'}"
                         </div>
                         <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                           {chunk.confidenceScores && chunk.confidenceScores.length > 0 && (
                             <span style={{ color: "#888", fontSize: "11px" }}>
                               confidence: {Math.round(chunk.confidenceScores[0] * 100)}%
                             </span>
                           )}
                           {sources.map((source, sourceIdx) => (
                             <button
                               key={sourceIdx}
                               onClick={() => window.open(source.uri, "_blank")}
                               style={{
                                 padding: "2px 6px",
                                 fontSize: "10px",
                                 backgroundColor: "#f0f0f0",
                                 border: "1px solid #ccc",
                                 borderRadius: "3px",
                                 cursor: "pointer",
                                 color: "#333",
                                 textDecoration: "none",
                               }}
                               onMouseEnter={(e) => {
                                 e.currentTarget.style.backgroundColor = "#e0e0e0";
                               }}
                               onMouseLeave={(e) => {
                                 e.currentTarget.style.backgroundColor = "#f0f0f0";
                               }}
                               title={`View source: ${source.title}`}
                             >
                               📄 {source.title}
                             </button>
                           ))}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
             )}

      {/* Info box about grounding */}
      <div
        style={{
          marginTop: "15px",
          padding: "8px",
          backgroundColor: "#f8f9fa",
          border: "1px solid #e9ecef",
          borderRadius: "4px",
          fontSize: "11px",
          color: "#6c757d",
        }}
      >
        <strong>ℹ️ Grounding Search:</strong> This response was generated using real-time web search results.
        Click the search query buttons above to view the original search results.
      </div>
    </div>
  );
}; 