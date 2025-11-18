/**
 * Vocabulary Studied List Screen
 * 
 * Displays all vocabulary words that the user has studied.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useVocabulary } from '../contexts/VocabularyContext';
import vocabularyDataService from '../services/vocabulary-data.service';
import { VocabularyWord } from '../types/vocabulary.types';
import Icon from 'react-native-vector-icons/MaterialIcons';

const VocabularyStudiedListScreen: React.FC = () => {
  const { t, i18n } = useCustomTranslation();
  const { progress } = useVocabulary();
  const currentLang = i18n.language;
  const [studiedWords, setStudiedWords] = useState<VocabularyWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadStudiedWords();
  }, []);

  const loadStudiedWords = async () => {
    if (!progress) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const studiedWordIds = Object.keys(progress.cards);
      
      // Fetch all studied words
      const words: VocabularyWord[] = [];
      for (const wordId of studiedWordIds) {
        const word = await vocabularyDataService.getWordById(wordId);
        if (word) {
          words.push(word);
        }
      }
      
      setStudiedWords(words);
    } catch (error) {
      console.error('[VocabularyStudiedListScreen] Error loading studied words:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = (wordId: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(wordId)) {
      newExpanded.delete(wordId);
    } else {
      newExpanded.add(wordId);
    }
    setExpandedIds(newExpanded);
  };

  const getTranslation = (word: VocabularyWord): string => {
    const currentLang = i18n.language;
    
    // Map language codes
    const langMap: { [key: string]: keyof VocabularyWord['translations'] } = {
      'en': 'en',
      'de': 'de',
      'es': 'es',
      'fr': 'fr',
      'ru': 'ru',
      'ar': 'ar',
    };
    
    const langKey = langMap[currentLang] || 'en';
    return word.translations[langKey] || word.translations.en || '';
  };

  const renderWordItem = ({ item }: { item: VocabularyWord }) => {
    const isExpanded = expandedIds.has(item.id);
    const translation = getTranslation(item);
    const cardProgress = progress?.cards[item.id];

    return (
      <TouchableOpacity
        style={styles.wordCard}
        onPress={() => toggleExpanded(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.wordHeader}>
          <View style={styles.wordMainInfo}>
            <Text style={styles.wordText}>
              {item.article ? `${item.article} ` : ''}
              {item.word}
            </Text>
            <Text style={styles.translationText}>{translation}</Text>
            {cardProgress && (
              <View style={styles.statusBadge}>
                <Icon 
                  name={cardProgress.state === 'review' ? 'check-circle' : 'school'} 
                  size={14} 
                  color={cardProgress.state === 'review' ? colors.success[500] : colors.warning[500]} 
                />
                <Text style={styles.statusText}>
                  {t(`vocabulary.cardState.${cardProgress.state}`)}
                </Text>
              </View>
            )}
          </View>
          <Icon 
            name={isExpanded ? 'expand-less' : 'expand-more'} 
            size={24} 
            color={colors.text.tertiary} 
          />
        </View>

        {isExpanded && item.exampleSentences.length > 0 && (
          <View style={styles.examplesContainer}>
            <Text style={styles.examplesTitle}>{t('vocabulary.examples')}</Text>
            {item.exampleSentences.map((example, index) => (
              <View key={index} style={styles.exampleItem}>
                <Text style={styles.exampleText}>{example.text}</Text>
                {example.translations && (
                  <Text style={styles.exampleTranslation}>
                    {example.translations[currentLang as keyof typeof example.translations]}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (studiedWords.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="book" size={64} color={colors.secondary[300]} />
        <Text style={styles.emptyTitle}>{t('vocabulary.noStudiedWords')}</Text>
        <Text style={styles.emptyDescription}>
          {t('vocabulary.noStudiedWordsDesc')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t('vocabulary.studiedWords', { count: studiedWords.length })}
        </Text>
      </View>

      <FlatList
        data={studiedWords}
        renderItem={renderWordItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.xl,
    backgroundColor: colors.background.primary,
  },
  emptyTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginTop: spacing.margin.lg,
    marginBottom: spacing.margin.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  header: {
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.lg,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
  },
  listContent: {
    padding: spacing.padding.lg,
    gap: spacing.margin.md,
  },
  wordCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.padding.md,
    ...spacing.shadow.sm,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordMainInfo: {
    flex: 1,
    gap: spacing.margin.xs,
  },
  wordText: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  translationText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.margin.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.padding.sm,
    paddingVertical: 4,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
  },
  statusText: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
    fontSize: 11,
  },
  examplesContainer: {
    marginTop: spacing.margin.md,
    paddingTop: spacing.padding.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  examplesTitle: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.margin.sm,
  },
  exampleItem: {
    marginBottom: spacing.margin.sm,
    paddingLeft: spacing.padding.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary[500],
  },
  exampleText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    marginBottom: 2,
  },
  exampleTranslation: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});

export default VocabularyStudiedListScreen;

