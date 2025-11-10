import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import dataService from '../../services/data.service';
import AdBanner from '../../components/AdBanner';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { HIDE_ADS } from '../../config/development.config';

const SpeakingB2StructureScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'parts' | 'hints'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [structureData, setStructureData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await dataService.getOralExamStructure();
      setStructureData(data);
      console.log('Oral Exam Structure Data:', data);
    } catch (error) {
      console.error('Error loading oral exam structure data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get text in current language
  const getLocalizedText = (obj: any): string => {
    if (!obj) return '';
    const lang = i18n.language;
    // Try to get the language-specific text, fallback to English
    return obj[lang] || obj['en'] || '';
  };

  const renderOverviewTab = () => {
    if (!structureData) return null;

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speaking.b2Structure.sections.howItWorks')}</Text>
          <View style={styles.textCard}>
            <Text style={styles.bodyText}>{getLocalizedText(structureData.general?.howItWorks)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speaking.b2Structure.sections.expectations')}</Text>
          <View style={styles.textCard}>
            <Text style={styles.bodyText}>{getLocalizedText(structureData.general?.expectations)}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderPartsTab = () => {
    if (!structureData || !structureData.parts) return null;

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
        {structureData.parts.map((part: any, index: number) => (
          <View key={index} style={styles.partCard}>
            <Text style={styles.partTitle}>{getLocalizedText(part.name)}</Text>
            
            <View style={styles.partInfoRow}>
              <View style={styles.partInfoItem}>
                <Text style={styles.partInfoLabel}>{t('speaking.b2Structure.labels.duration')}:</Text>
                <Text style={styles.partInfoValue}>{getLocalizedText(part.duration)}</Text>
              </View>
              <View style={styles.partInfoItem}>
                <Text style={styles.partInfoLabel}>{t('speaking.b2Structure.labels.participants')}:</Text>
                <Text style={styles.partInfoValue}>{getLocalizedText(part.participants)}</Text>
              </View>
            </View>

            <View style={styles.partSection}>
              <Text style={styles.partSectionTitle}>{t('speaking.b2Structure.labels.description')}:</Text>
              <Text style={styles.bodyText}>{getLocalizedText(part.description)}</Text>
            </View>

            {part.sample && (
              <View style={styles.partSection}>
                <Text style={styles.partSectionTitle}>{t('speaking.b2Structure.labels.sample')}:</Text>
                <Text style={styles.bodyText}>{part.sample['de']}</Text>
              </View>
            )}

            {part.topics && (
              <View style={styles.partSection}>
                <Text style={styles.partSectionTitle}>{t('speaking.b2Structure.labels.topics')}:</Text>
                {part.topics.map((topic: any, topicIndex: number) => (
                  <Text key={topicIndex} style={styles.bulletText}>
                    • {topic['de']}
                  </Text>
                ))}
              </View>
            )}

            {part.article && (
              <View style={styles.partSection}>
                <Text style={styles.partSectionTitle}>{t('speaking.b2Structure.labels.exampleArticle')}:</Text>
                <View style={styles.articleCard}>
                  <Text style={styles.articleTitle}>{part.article.title['de']}</Text>
                  <Text style={styles.articleContent}>{part.article.content['de']}</Text>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderHintsTab = () => {
    if (!structureData) return null;

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speaking.b2Structure.sections.hints')}</Text>
          <View style={styles.hintsCard}>
            <Text style={styles.bodyText}>{getLocalizedText(structureData.hints)}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text
            style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}
          >
            {t('speaking.b2Structure.tabs.overview')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'parts' && styles.activeTab]}
          onPress={() => setActiveTab('parts')}
        >
          <Text
            style={[styles.tabText, activeTab === 'parts' && styles.activeTabText]}
          >
            {t('speaking.b2Structure.tabs.examParts')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'hints' && styles.activeTab]}
          onPress={() => setActiveTab('hints')}
        >
          <Text
            style={[styles.tabText, activeTab === 'hints' && styles.activeTabText]}
          >
            {t('speaking.b2Structure.tabs.hints')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'parts' && renderPartsTab()}
      {activeTab === 'hints' && renderHintsTab()}

      {!HIDE_ADS && <AdBanner />}
    </SafeAreaView>
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
  },
  loadingText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.padding.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    lineHeight: 15,
    textAlign: 'center',
  },
  activeTabText: {
    color: colors.primary[500],
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
  },
  section: {
    marginBottom: spacing.margin.lg,
  },
  sectionTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[500],
    marginBottom: spacing.margin.md,
  },
  textCard: {
    backgroundColor: colors.white,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bodyText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
  partCard: {
    backgroundColor: colors.white,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: spacing.margin.lg,
  },
  partTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[500],
    marginBottom: spacing.margin.md,
  },
  partInfoRow: {
    flexDirection: 'row',
    marginBottom: spacing.margin.md,
    gap: spacing.margin.md,
  },
  partInfoItem: {
    flex: 1,
  },
  partInfoLabel: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    marginBottom: spacing.margin.xs,
  },
  partInfoValue: {
    ...typography.textStyles.body,
    color: colors.text.primary,
  },
  partSection: {
    marginTop: spacing.margin.md,
  },
  partSectionTitle: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
    marginBottom: spacing.margin.sm,
  },
  bulletText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: spacing.margin.xs,
    paddingLeft: spacing.padding.sm,
  },
  articleCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginTop: spacing.margin.sm,
  },
  articleTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
  },
  articleContent: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: spacing.margin.md,
  },
  articleSource: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    fontStyle: 'italic' as 'italic',
  },
  hintsCard: {
    backgroundColor: colors.white,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[500],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  copyrightText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic' as 'italic',
  },
});

export default SpeakingB2StructureScreen;

