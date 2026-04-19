import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useAppTheme } from '../../contexts/ThemeContext';
import { spacing, type ThemeColors, type Typography } from '../../theme';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface WritingModelAnswerProps {
  answer: string;
}

const WritingModelAnswer: React.FC<WritingModelAnswerProps> = ({ answer }) => {
  const { t } = useCustomTranslation();
  const { colors, typography } = useAppTheme();
  const styles = createStyles(colors, typography);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const handleCopy = () => {
    Clipboard.setString(answer);
    setCopied(true);
    
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => setCopied(false));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.icon}>⭐</Text>
          <Text style={styles.title}>{t('writing.evaluation.modelAnswer')}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={handleCopy}
            style={styles.copyButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="content-copy" size={20} color={colors.success[700]} />
          </TouchableOpacity>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </View>
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.content}>
          <Text style={styles.text}>{answer}</Text>
          <Animated.View style={[styles.copyToast, { opacity: fadeAnim }]}>
            <Text style={styles.copyToastText}>{t('common.copied') || 'Copied!'}</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) => StyleSheet.create({
  container: {
    backgroundColor: colors.success[50],
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    borderWidth: 1,
    borderColor: colors.success[200],
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.padding.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 18,
    marginRight: spacing.margin.xs,
  },
  title: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.success[700],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyButton: {
    marginRight: spacing.margin.md,
    padding: 4,
  },
  expandIcon: {
    fontSize: 16,
    color: colors.success[700],
    width: 20,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: spacing.padding.md,
    paddingBottom: spacing.padding.md,
    position: 'relative',
  },
  text: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  copyToast: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  copyToastText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default WritingModelAnswer;
