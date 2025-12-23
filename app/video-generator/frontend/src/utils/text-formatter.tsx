import React, { CSSProperties } from 'react';

interface TextPart {
  text: string;
  bold?: boolean;
  underline?: boolean;
}

interface FormatTextOptions {
  boldStyle?: CSSProperties;
  underlineStyle?: CSSProperties;
}

/**
 * Format text with underline (_text_) and bold (_b_text_b_) markers
 * Handles newlines by splitting into separate divs
 * Web version for React (not React Native)
 * 
 * @param text - The text to format
 * @param options - Optional styles for bold and underline text
 * @returns Array of div elements with appropriate formatting
 * 
 * @example
 * formatText("Normal _underlined_\nNew line _b_bold_b_ text", {
 *   boldStyle: { fontWeight: 'bold' },
 *   underlineStyle: { textDecoration: 'underline' }
 * })
 */
export const formatText = (
  text: string,
  options?: FormatTextOptions
): React.ReactNode => {
  // Split by newlines first
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    const parts: TextPart[] = [];
    let currentIndex = 0;
    
    // Match both _b_..._b_ and _..._
    const regex = /_b_(.*?)_b_|_(.*?)_/g;
    let match;
    
    while ((match = regex.exec(line)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push({ text: line.substring(currentIndex, match.index) });
      }
      
      // Add the matched text with formatting
      if (match[1] !== undefined) {
        // Bold text (_b_..._b_)
        parts.push({ text: match[1], bold: true });
      } else if (match[2] !== undefined) {
        // Underlined text (_..._)
        parts.push({ text: match[2], underline: true });
      }
      
      currentIndex = regex.lastIndex;
    }
    
    // Add remaining text
    if (currentIndex < line.length) {
      parts.push({ text: line.substring(currentIndex) });
    }
    
    return (
      <div key={lineIndex}>
        {parts.map((part, index) => (
          <span
            key={index}
            style={{
              ...(part.bold ? options?.boldStyle : {}),
              ...(part.underline ? options?.underlineStyle : {}),
            }}
          >
            {part.text}
          </span>
        ))}
      </div>
    );
  });
};

