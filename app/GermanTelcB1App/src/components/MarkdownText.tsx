import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';

interface MarkdownTextProps {
  text: string;
  baseStyle?: TextStyle;
  boldStyle?: TextStyle;
  italicStyle?: TextStyle;
}

interface TextPart {
  text: string;
  bold: boolean;
  italic: boolean;
}

/**
 * A simple markdown text renderer that supports:
 * - Bold text: **text**
 * - Italic text: *text*
 * - Line breaks
 */
const MarkdownText: React.FC<MarkdownTextProps> = ({ 
  text, 
  baseStyle, 
  boldStyle,
  italicStyle,
}) => {
  // Merge default styles with provided styles
  const mergedBaseStyle = { ...styles.baseStyle, ...baseStyle };
  const mergedBoldStyle = { ...styles.boldStyle, ...boldStyle };
  const mergedItalicStyle = { ...styles.italicStyle, ...italicStyle };

  // Split text by newlines to preserve line breaks
  const lines = text.split('\n');
  
  return (
    <>
      {lines.map((line, lineIndex) => {
        const parts: TextPart[] = [];
        let currentPos = 0;
        
        // Combined regex to match both bold and italic
        // Priority: bold-italic (***), bold (**), italic (*)
        const markdownRegex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*)/g;
        let match;
        
        while ((match = markdownRegex.exec(line)) !== null) {
          // Add text before the match
          if (match.index > currentPos) {
            parts.push({ 
              text: line.slice(currentPos, match.index), 
              bold: false,
              italic: false,
            });
          }
          
          // Determine what was matched and add the styled text
          if (match[2] !== undefined) {
            // Bold-italic: ***text***
            parts.push({ text: match[2], bold: true, italic: true });
          } else if (match[3] !== undefined) {
            // Bold: **text**
            parts.push({ text: match[3], bold: true, italic: false });
          } else if (match[4] !== undefined) {
            // Italic: *text*
            parts.push({ text: match[4], bold: false, italic: true });
          }
          
          currentPos = match.index + match[0].length;
        }
        
        // Add remaining text
        if (currentPos < line.length) {
          parts.push({ 
            text: line.slice(currentPos), 
            bold: false,
            italic: false,
          });
        }
        
        // If no markdown was found, just add the line as is
        if (parts.length === 0) {
          parts.push({ text: line, bold: false, italic: false });
        }
        
        return (
          <Text key={lineIndex} style={mergedBaseStyle}>
            {parts.map((part, partIndex) => {
              // Build style array for this part
              const partStyles: TextStyle[] = [];
              if (part.bold) partStyles.push(mergedBoldStyle);
              if (part.italic) partStyles.push(mergedItalicStyle);
              
              return (
                <Text 
                  key={partIndex} 
                  style={partStyles.length > 0 ? partStyles : undefined}
                >
                  {part.text}
                </Text>
              );
            })}
            {lineIndex < lines.length - 1 && '\n'}
          </Text>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  baseStyle: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  boldStyle: {
    fontWeight: typography.fontWeight.bold,
  },
  italicStyle: {
    fontStyle: 'italic',
  },
});

export default MarkdownText;

