import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { spacing, type ThemeColors, type Typography } from '../../theme';
import Card from '../../components/Card';
import { HomeStackNavigationProp, HomeStackParamList } from '../../types/navigation.types';
import ExamSelectionModal from '../../components/ExamSelectionModal';
import { dataService } from '../../services/data.service';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { useAppTheme } from '../../contexts/ThemeContext';
import { activeExamConfig } from '../../config/active-exam.config';
import SectionStatsCard from '../../components/SectionStatsCard';
import CardsListSeperator from '../../components/CardsListSeperator';
import { ExamPartConfig } from '../../config/exam-config.types';

type SectionMenuRouteParams = {
  SectionMenu: { sectionId: string };
};

const SectionMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const route = useRoute<RouteProp<SectionMenuRouteParams, 'SectionMenu'>>();
  const { sectionId } = route.params;
  const { t } = useCustomTranslation();
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  const section = useMemo(
    () => activeExamConfig.sections.find(s => s.id === sectionId)!,
    [sectionId],
  );

  // State: exam lists keyed by part.id
  const [examsByPart, setExamsByPart] = useState<Record<string, any[]>>({});
  // State: which part's modal is visible (null = none)
  const [activeModalPartId, setActiveModalPartId] = useState<string | null>(null);

  // Load exam data for all parts
  useEffect(() => {
    const loadData = async () => {
      const results: Record<string, any[]> = {};
      await Promise.all(
        section.parts
          .filter(part => part.hasExamSelection)
          .map(async part => {
            const method = part.dataLoader.listMethod;
            const data = await (dataService as any)[method]();
            if (Array.isArray(data)) {
              results[part.id] = data;
            } else if (part.dataLoader.listResponseKey && data?.[part.dataLoader.listResponseKey]) {
              const items = data[part.dataLoader.listResponseKey];
              // If items don't have 'id' field, map them with index as id
              // If items have 'name' but not 'title', map name to title for modal display
              results[part.id] = Array.isArray(items)
                ? items.map((item: any, idx: number) => ({
                    ...item,
                    ...(item.id === undefined ? { id: idx } : {}),
                    ...(item.title === undefined && item.name ? { title: item.name } : {}),
                  }))
                : [];
            } else {
              results[part.id] = data?.exams || [];
            }
          }),
      );
      setExamsByPart(results);
    };
    loadData();
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: sectionId });
  }, [sectionId]);

  const handlePartPress = useCallback(
    (part: ExamPartConfig) => {
      if (part.hasExamSelection) {
        logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, {
          section: sectionId,
          part: part.partNumber,
        });
        setActiveModalPartId(part.id);
      } else {
        // Direct navigation (e.g., speaking parts without exam selection)
        logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, {
          section: sectionId,
          part: part.partNumber,
        });
        navigation.navigate(part.screenKey as any);
      }
    },
    [sectionId, navigation],
  );

  const handleSelectExam = useCallback(
    (part: ExamPartConfig, examId: string) => {
      logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, {
        section: sectionId,
        part: part.partNumber,
        exam_id: examId,
      });
      const paramKey = part.navigationParamKey || 'examId';
      console.log('Navigating to', part.screenKey, 'with params', { [paramKey]: examId });
      navigation.navigate(part.screenKey as any, { [paramKey]: examId } as any);
    },
    [sectionId, navigation],
  );

  const handleExtraItemPress = useCallback(
    (item: { screenKey: string; id: string }) => {
      logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, {
        section: sectionId,
        extra_item: item.id,
      });
      navigation.navigate(item.screenKey as any);
    },
    [sectionId, navigation],
  );

  const sectionLabelKey = section.id === 'reading'
    ? 'home.practiceSections.reading'
    : section.id === 'listening'
    ? 'home.practiceSections.listening'
    : section.id === 'grammar'
    ? 'home.practiceSections.grammar'
    : section.id === 'writing'
    ? 'home.practiceSections.writing'
    : undefined;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {sectionLabelKey && (
          <SectionStatsCard section={sectionId} sectionLabel={t(sectionLabelKey)} />
        )}

        {section.parts.map(part => (
          <React.Fragment key={part.id}>
            {part.separatorBeforeKey && (
              <CardsListSeperator title={t(part.separatorBeforeKey)} />
            )}
            <Card
              style={styles.card}
              onPress={() => handlePartPress(part)}
            >
              <Text style={styles.cardTitle}>{t(part.titleKey)}</Text>
              <Text style={styles.cardDescription}>{t(part.descriptionKey)}</Text>
            </Card>
          </React.Fragment>
        ))}

        {section.extraMenuItems && section.extraMenuItems.length > 0 && (
          <>
            <CardsListSeperator title={t(`practice.${sectionId}.separator`)} />
            {section.extraMenuItems.map(item => (
              <Card
                key={item.id}
                style={styles.card}
                onPress={() => handleExtraItemPress(item)}
              >
                <Text style={styles.cardTitle}>
                  {t(item.titleKey, item.titleParams)}
                </Text>
                <Text style={styles.cardDescription}>
                  {t(item.descriptionKey, item.descriptionParams)}
                </Text>
              </Card>
            ))}
          </>
        )}
      </ScrollView>

      {section.parts
        .filter(part => part.hasExamSelection)
        .map(part => (
          <ExamSelectionModal
            key={part.id}
            visible={activeModalPartId === part.id}
            onClose={() => setActiveModalPartId(null)}
            exams={examsByPart[part.id] || []}
            onSelectExam={(examId: string) => handleSelectExam(part, examId)}
            examType={sectionId}
            partNumber={part.partNumber}
            title={t(part.titleKey)}
            itemType={part.modalItemType ? t(part.modalItemType) : undefined}
          />
        ))}
    </View>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.padding.lg,
    },
    card: {
      marginBottom: spacing.margin.lg,
      minHeight: 100,
      justifyContent: 'center',
      backgroundColor: colors.background.secondary,
    },
    cardTitle: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
      marginBottom: spacing.margin.sm,
      textAlign: 'left',
    },
    cardDescription: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      lineHeight: 24,
      textAlign: 'left',
    },
  });

export default SectionMenuScreen;
