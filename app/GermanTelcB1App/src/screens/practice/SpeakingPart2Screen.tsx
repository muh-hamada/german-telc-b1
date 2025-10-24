import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-native-markdown-display';
import { colors, spacing, typography } from '../../theme';
import speakingPart2Data from '../../data/speaking-part2.json';
import AdBanner from '../../components/AdBanner';
import { HIDE_ADS } from '../../config/demo.config';

interface Topic {
  id: number;
  title: string;
  viewA: {
    person: string;
    text: string;
  };
  viewB: {
    person: string;
    text: string;
  };
  discussion: Array<{
    question: string;
    tip: string;
  }>;
}

const SpeakingPart2Screen: React.FC = () => {
  const { t } = useTranslation();
  const [selectedTopicId, setSelectedTopicId] = useState<number>(1);
  const [activeView, setActiveView] = useState<'A' | 'B'>('A');
  const [showPartnerSummary, setShowPartnerSummary] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const topics = (speakingPart2Data as any).topics as Topic[];
  const currentTopic = topics?.find(t => t.id === selectedTopicId) || topics?.[0];

  const renderTopicDropdown = () => {
    if (!topics || topics.length === 0) return null;
    
    return (
      <>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setIsDropdownOpen(true)}
        >
          <Text style={styles.dropdownButtonText}>
            {currentTopic?.title || t('speaking.part2.selectTopic')}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>

        <Modal
          visible={isDropdownOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsDropdownOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsDropdownOpen(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('speaking.part2.topicSelection')}</Text>
                <TouchableOpacity
                  onPress={() => setIsDropdownOpen(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={topics}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      selectedTopicId === item.id && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setSelectedTopicId(item.id);
                      setActiveView('A');
                      setShowPartnerSummary(false);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedTopicId === item.id && styles.dropdownItemTextActive,
                      ]}
                    >
                      {item.title}
                    </Text>
                    {selectedTopicId === item.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  };

  const formatPersonText = (person: string, text: string): string => {
    return `**${person}:**\n\n${text}`;
  };

  const createPartnerSummary = (view: { person: string; text: string }): string => {
    const [namePart] = view.person.split(',');
    const name = namePart.trim();
    const isFemale = name.includes('Frau') || 
                     ['Sabine', 'Hannelore', 'Laura', 'Julia', 'Mia', 'Karin', 'Schmidt', 'Marie', 'Anna'].some(n => name.includes(n));
    
    const pronoun = isFemale ? 'Sie' : 'Er';
    const pronounLower = pronoun.toLowerCase();
    
    return `**${view.person}:**\n\n${pronoun} ist der Meinung, dass das Thema wichtig ist. ${pronoun} findet die Argumente überzeugend und hat eine klare Position dazu.`;
  };

  const renderViewContent = () => {
    if (!currentTopic) return null;
    
    const view = activeView === 'A' ? currentTopic.viewA : currentTopic.viewB;
    const partnerView = activeView === 'A' ? currentTopic.viewB : currentTopic.viewA;

    return (
      <View style={styles.viewContent}>
        <View style={styles.textCard}>
          <Text style={styles.cardTitle}>{t('speaking.part2.instructions.startingText')}</Text>
          <Markdown style={markdownStyles}>
            {formatPersonText(view.person, view.text)}
          </Markdown>
        </View>

        <View style={styles.partnerSection}>
          <Text style={styles.partnerTitle}>
            {t('speaking.part2.sections.partnerSummary')}
          </Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowPartnerSummary(!showPartnerSummary)}
          >
            <Text style={styles.toggleButtonText}>
              {showPartnerSummary
                ? t('speaking.part2.buttons.hideSummary')
                : t('speaking.part2.buttons.showSummary')}
            </Text>
          </TouchableOpacity>

          {showPartnerSummary && (
            <View style={styles.summaryCard}>
              <Markdown style={markdownStylesSummary}>
                {createPartnerSummary(partnerView)}
              </Markdown>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderDiscussion = () => {
    if (!currentTopic || !currentTopic.discussion) return null;
    
    return (
      <View style={styles.discussionSection}>
        <Text style={styles.discussionTitle}>
          {t('speaking.part2.sections.discussion')}
        </Text>
        <Text style={styles.discussionDescription}>
          {t('speaking.part2.sections.discussionNote')}
        </Text>

        {currentTopic.discussion.map((item, index) => (
          <View key={index} style={styles.discussionCard}>
            <Text style={styles.questionText}>Q: {item.question}</Text>
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>
                <Text style={styles.tipLabel}>Tipp: </Text>
                {item.tip}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Topic Selection */}
        <Text style={styles.sectionTitle}>{t('speaking.part2.sections.topicSelectionLabel')}</Text>
        <View style={styles.section}>
          {renderTopicDropdown()}
        </View>

        {/* Main Content */}
        {currentTopic && (
          <View style={styles.mainCard}>
            <Text style={styles.topicTitle}>{currentTopic.title}</Text>
          <Text style={styles.instructionText}>
            {t('speaking.part2.instructions.taskDescription')}
          </Text>

          {/* View Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeView === 'A' && styles.activeTab]}
              onPress={() => {
                setActiveView('A');
                setShowPartnerSummary(false);
              }}
            >
              <Text style={[styles.tabText, activeView === 'A' && styles.activeTabText]}>
                {t('speaking.part2.tabs.yourRole')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeView === 'B' && styles.activeTab]}
              onPress={() => {
                setActiveView('B');
                setShowPartnerSummary(false);
              }}
            >
              <Text style={[styles.tabText, activeView === 'B' && styles.activeTabText]}>
                {t('speaking.part2.tabs.partnerRole')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* View Content */}
          {renderViewContent()}

          {/* Discussion */}
          {renderDiscussion()}
        </View>
        )}
      </ScrollView>
      {!HIDE_ADS && <AdBanner />}
    </SafeAreaView>
  );
};

const markdownStyles = {
  body: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
  paragraph: {
    marginBottom: spacing.margin.sm,
  },
  strong: {
    fontWeight: '700' as '700',
    color: colors.primary[700],
  },
};

const markdownStylesSummary = {
  body: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
  paragraph: {
    marginBottom: spacing.margin.sm,
  },
  strong: {
    fontWeight: '700' as '700',
    color: colors.error[600],
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
  },
  sectionTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  section: {
    marginBottom: spacing.margin.lg,
  },
  dropdownButton: {
    width: '100%',
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary[500],
    backgroundColor: colors.background.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  dropdownArrow: {
    ...typography.textStyles.body,
    color: colors.primary[500],
    marginLeft: spacing.margin.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  modalTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.padding.xs,
  },
  closeButtonText: {
    ...typography.textStyles.h3,
    color: colors.text.secondary,
  },
  dropdownItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[100],
  },
  dropdownItemActive: {
    backgroundColor: colors.primary[50],
  },
  dropdownItemText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  dropdownItemTextActive: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  checkmark: {
    ...typography.textStyles.h3,
    color: colors.primary[500],
    marginLeft: spacing.margin.sm,
  },
  mainCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.padding.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  topicTitle: {
    ...typography.textStyles.h2,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  instructionText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.margin.lg,
    lineHeight: 22,
  },
  tabsContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    marginBottom: spacing.margin.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.sm,
    borderTopLeftRadius: spacing.borderRadius.md,
    borderTopRightRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.secondary[200],
    backgroundColor: colors.background.primary,
  },
  activeTab: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  tabText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  activeTabText: {
    color: colors.background.secondary,
  },
  viewContent: {
    marginBottom: spacing.margin.xl,
  },
  textCard: {
    backgroundColor: colors.secondary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    marginBottom: spacing.margin.lg,
  },
  cardTitle: {
    ...typography.textStyles.h4,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
  },
  partnerSection: {
    marginTop: spacing.margin.md,
  },
  partnerTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  toggleButton: {
    backgroundColor: colors.warning[500],
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButtonText: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  summaryCard: {
    backgroundColor: colors.primary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginTop: spacing.margin.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  discussionSection: {
    borderTopWidth: 1,
    borderTopColor: colors.secondary[200],
    paddingTop: spacing.padding.lg,
    marginTop: spacing.margin.lg,
  },
  discussionTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
  },
  discussionDescription: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.margin.lg,
    lineHeight: 22,
  },
  discussionCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    borderWidth: 1,
    borderColor: colors.secondary[200],
  },
  questionText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  tipCard: {
    backgroundColor: colors.secondary[50],
    padding: spacing.padding.sm,
    borderRadius: spacing.borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[500],
    marginTop: spacing.margin.sm,
  },
  tipText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    lineHeight: 20,
  },
  tipLabel: {
    fontWeight: typography.fontWeight.bold,
  },
});

export default SpeakingPart2Screen;
