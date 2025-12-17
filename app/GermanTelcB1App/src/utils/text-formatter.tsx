import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

interface TextPart {
  text: string;
  bold?: boolean;
  underline?: boolean;
}

interface FormatTextOptions {
  boldStyle?: StyleProp<TextStyle>;
  underlineStyle?: StyleProp<TextStyle>;
}

/**
 * Format text with underline (_text_) and bold (_b_text_b_) markers
 * 
 * @param text - The text to format
 * @param options - Optional styles for bold and underline text
 * @returns Array of Text components with appropriate formatting
 * 
 * @example
 * formatText("Normal _underlined_ and _b_bold_b_ text", {
 *   boldStyle: { fontWeight: 'bold' },
 *   underlineStyle: { textDecorationLine: 'underline' }
 * })
 */
export const formatText = (
  text: string,
  options?: FormatTextOptions
): React.ReactNode => {
  const parts: TextPart[] = [];
  let currentIndex = 0;
  
  // Match both _b_..._b_ and _..._
  const regex = /_b_(.*?)_b_|_(.*?)_/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      parts.push({ text: text.substring(currentIndex, match.index) });
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
  if (currentIndex < text.length) {
    parts.push({ text: text.substring(currentIndex) });
  }
  
  return parts.map((part, index) => (
    <Text
      key={index}
      style={[
        part.bold && options?.boldStyle,
        part.underline && options?.underlineStyle,
      ]}
    >
      {part.text}
    </Text>
  ));
};

