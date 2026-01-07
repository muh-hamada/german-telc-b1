import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import { issueReportService, ReportedIssueDetails } from '../services/issue-report.service';
import { IssueReportCard } from '../components/IssueReportCard';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

const ReportedIssuesScreen: React.FC = () => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [reports, setReports] = useState<ReportedIssueDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const loadReports = useCallback(async (isRefresh = false) => {
    console.log('[ReportedIssuesScreen] Loading reports...', isRefresh);
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
      setError(null);

      const reportIds = await issueReportService.getLocalReportIds();
      
      if (reportIds.length === 0) {
        setReports([]);
        return;
      }

      const reportDetails = await issueReportService.getReportedIssues(reportIds);
      setReports(reportDetails);
      
      // Mark reports as seen when successfully loaded (only if not refreshing)
      if (!isRefresh && reportDetails.length > 0) {
        issueReportService.markReportsAsSeen(reportIds, 'screen');
        
        logEvent(AnalyticsEvents.ISSUE_REPORTS_SCREEN_VIEWED, {
          count: reportDetails.length,
          pendingCount: reportDetails.filter(r => r.displayStatus === 'pending').length,
          inProgressCount: reportDetails.filter(r => r.displayStatus === 'in_progress').length,
          resolvedCount: reportDetails.filter(r => r.displayStatus === 'resolved').length,
        });
      }
    } catch (err) {
      console.error('[ReportedIssuesScreen] Error loading reports:', err);
      setError(t('reportedIssues.error'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    console.log('[ReportedIssuesScreen] inside useEffect');
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array = run only once on mount

  const handleRefresh = () => {
    console.log('[ReportedIssuesScreen] inside handleRefresh');
    setIsRefreshing(true);
    loadReports(true);
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>{t('reportedIssues.loadingReports')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerContainer}>
          <Icon name="error-outline" size={64} color={colors.error[500]} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadReports()}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>{t('reportedIssues.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (reports.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary[500]]}
              tintColor={colors.primary[500]}
            />
          }
        >
          <Icon name="flag" size={64} color={colors.text.tertiary} />
          <Text style={styles.emptyStateText}>{t('reportedIssues.emptyState')}</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
      >
        {reports.map(report => (
          <IssueReportCard
            key={report.id}
            report={report}
            isExpanded={expandedIds.has(report.id)}
            onToggleExpand={() => toggleExpanded(report.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.md,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    loadingText: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      marginTop: spacing.md,
    },
    errorText: {
      ...typography.textStyles.body,
      color: colors.error[500],
      textAlign: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.lg,
    },
    retryButton: {
      backgroundColor: colors.primary[500],
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 8,
    },
    retryButtonText: {
      ...typography.textStyles.button,
      color: colors.white,
    },
    emptyStateText: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      textAlign: 'center',
      marginTop: spacing.lg,
      lineHeight: 24,
    },
  });

export default ReportedIssuesScreen;

