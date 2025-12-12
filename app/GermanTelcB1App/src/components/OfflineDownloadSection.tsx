/**
 * Offline Download Section
 * 
 * UI component for managing offline mode (premium feature).
 * Shows download progress, storage usage, and controls.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import NetInfo from '@react-native-community/netinfo';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import offlineService, { DownloadProgress, OfflineStatus } from '../services/offline.service';

interface OfflineDownloadSectionProps {
  onDownloadComplete?: () => void;
}

const OfflineDownloadSection: React.FC<OfflineDownloadSectionProps> = ({
  onDownloadComplete,
}) => {
  const { t } = useCustomTranslation();
  const [status, setStatus] = useState<OfflineStatus | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  // Subscribe to network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  // Load offline status on mount
  useEffect(() => {
    loadStatus();
    
    // Subscribe to progress updates
    const unsubscribe = offlineService.onProgressUpdate((newProgress) => {
      setProgress(newProgress);
      if (newProgress.status === 'completed') {
        loadStatus();
        onDownloadComplete?.();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [onDownloadComplete]);

  const loadStatus = async () => {
    setIsLoading(true);
    const offlineStatus = await offlineService.getOfflineStatus();
    setStatus(offlineStatus);
    setIsLoading(false);
  };

  const handleEnableOffline = async () => {
    // Check if online before allowing download/update
    if (!isConnected) {
      Alert.alert(
        t('offline.requiresConnectionTitle'),
        t('offline.requiresConnectionMessage')
      );
      return;
    }

    Alert.alert(
      t('offline.enableTitle'),
      t('offline.enableMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('offline.download'),
          onPress: async () => {
            await offlineService.enableOfflineMode();
            await loadStatus();
          },
        },
      ]
    );
  };

  const handleDisableOffline = async () => {
    Alert.alert(
      t('offline.disableTitle'),
      t('offline.disableMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('offline.clear'),
          style: 'destructive',
          onPress: async () => {
            await offlineService.disableOfflineMode();
            await loadStatus();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary[500]} />
      </View>
    );
  }

  const isDownloading = progress?.status === 'downloading';
  const downloadPercent = progress && progress.totalItems > 0
    ? Math.round((progress.downloadedItems / progress.totalItems) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Icon name="download" size={20} color={colors.primary[500]} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{t('offline.title')}</Text>
          <Text style={styles.subtitle}>{t('offline.subtitle')}</Text>
        </View>
      </View>

      {/* Download Progress */}
      {isDownloading && progress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${downloadPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progress.currentItem} ({downloadPercent}%)
          </Text>
        </View>
      )}

      {/* Status Info */}
      {!isDownloading && status && (
        <View style={styles.statusContainer}>
          {status.isDownloaded ? (
            <>
              <View style={styles.statusRow}>
                <Icon name="check-circle" size={16} color={colors.success[500]} />
                <Text style={styles.statusText}>{t('offline.downloaded')}</Text>
              </View>
              <View style={styles.statusRow}>
                <Icon name="database" size={16} color={colors.text.tertiary} />
                <Text style={styles.statusTextSecondary}>
                  {status.storageUsedMB.toFixed(1)} MB {t('offline.used')}
                </Text>
              </View>
              {status.lastDownloadDate && (
                <View style={styles.statusRow}>
                  <Icon name="clock-o" size={16} color={colors.text.tertiary} />
                  <Text style={styles.statusTextSecondary}>
                    {t('offline.lastUpdated')} {new Date(status.lastDownloadDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.statusRow}>
              <Icon name="cloud-download" size={16} color={colors.text.tertiary} />
              <Text style={styles.statusTextSecondary}>{t('offline.notDownloaded')}</Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      {!isDownloading && (
        <View style={styles.actions}>
          {status?.isDownloaded ? (
            <>
              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleEnableOffline}
              >
                <Icon name="refresh" size={14} color={colors.primary[500]} />
                <Text style={styles.updateButtonText}>{t('offline.update')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleDisableOffline}
              >
                <Text style={styles.clearButtonText}>{t('offline.clear')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleEnableOffline}
            >
              <Icon name="download" size={14} color={colors.background.primary} />
              <Text style={styles.downloadButtonText}>{t('offline.downloadNow')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Error State */}
      {progress?.status === 'error' && (
        <View style={styles.errorContainer}>
          <Icon name="exclamation-circle" size={16} color={colors.error[500]} />
          <Text style={styles.errorText}>{progress.error || t('offline.error')}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.padding.lg,
    marginBottom: spacing.margin.md,
    ...spacing.shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.margin.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.margin.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  subtitle: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  progressContainer: {
    marginBottom: spacing.margin.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.secondary[100],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.margin.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  progressText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: spacing.margin.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.margin.xs,
    gap: spacing.margin.sm,
  },
  statusText: {
    ...typography.textStyles.body,
    color: colors.success[600],
  },
  statusTextSecondary: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.margin.sm,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: colors.primary[500],
    borderRadius: spacing.borderRadius.md,
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.margin.xs,
  },
  downloadButtonText: {
    ...typography.textStyles.body,
    color: colors.background.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  updateButton: {
    flex: 1,
    backgroundColor: colors.primary[50],
    borderRadius: spacing.borderRadius.md,
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.margin.xs,
  },
  updateButtonText: {
    ...typography.textStyles.body,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold,
  },
  clearButton: {
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.md,
  },
  clearButtonText: {
    ...typography.textStyles.body,
    color: colors.text.tertiary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.margin.sm,
    marginTop: spacing.margin.sm,
    padding: spacing.padding.sm,
    backgroundColor: colors.error[50],
    borderRadius: spacing.borderRadius.md,
  },
  errorText: {
    ...typography.textStyles.bodySmall,
    color: colors.error[600],
    flex: 1,
  },
});

export default OfflineDownloadSection;

