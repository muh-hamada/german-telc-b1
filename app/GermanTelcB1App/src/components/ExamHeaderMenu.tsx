import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAppTheme } from '../contexts/ThemeContext';
import { useCustomTranslation } from '../hooks/useCustomTranslation';

interface ExamHeaderMenuProps {
  isCompleted?: boolean;
  onToggleCompletion?: () => void;
  onReportIssue?: () => void;
}

const ExamHeaderMenu: React.FC<ExamHeaderMenuProps> = ({
  isCompleted,
  onToggleCompletion,
  onReportIssue,
}) => {
  const { colors, isBigFont, toggleFontSize } = useAppTheme();
  const { t } = useCustomTranslation();
  const { top: safeTop } = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);

  const menuTop = safeTop + (Platform.OS === 'ios' ? 44 : 56);

  const handleFontSizeToggle = () => {
    toggleFontSize();
    // Stay open so user can see the Aa/AA badge update
  };

  const handleReportIssue = () => {
    setMenuVisible(false);
    // Delay until the menu Modal has fully dismissed before opening another Modal
    setTimeout(() => onReportIssue?.(), 300);
  };

  const handleToggleCompletion = () => {
    setMenuVisible(false);
    onToggleCompletion?.();
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setMenuVisible(true)}
        style={styles.dotsButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon name="ellipsis-v" size={22} color={colors.navigation.text} />
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          onPress={() => setMenuVisible(false)}
          activeOpacity={1}
        >
          <View
            style={[
              styles.menuShadow,
              { top: menuTop },
            ]}
          >
            <View
              style={[
                styles.menuInner,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
              ]}
            >
            {/* Font size toggle */}
            <TouchableOpacity style={styles.menuItem} onPress={handleFontSizeToggle}>
              <Icon name="font" size={15} color={colors.text.primary} style={styles.menuIcon} />
              <Text style={[styles.menuLabel, { color: colors.text.primary }]}>
                {t('settings.largeFont')}
              </Text>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isBigFont
                      ? colors.primary[100]
                      : colors.background.secondary,
                    borderColor: isBigFont ? colors.primary[500] : colors.border.light,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: isBigFont ? colors.primary[700] : colors.text.secondary },
                  ]}
                >
                  {isBigFont ? 'AA' : 'Aa'}
                </Text>
              </View>
            </TouchableOpacity>

            {onReportIssue && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border.light }]} />
                <TouchableOpacity style={styles.menuItem} onPress={handleReportIssue}>
                  <Icon name="flag" size={15} color={colors.warning[500]} style={styles.menuIcon} />
                  <Text style={[styles.menuLabel, { color: colors.text.primary }]}>
                    {t('issueReport.reportIssue')}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {onToggleCompletion && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border.light }]} />
                <TouchableOpacity style={styles.menuItem} onPress={handleToggleCompletion}>
                  <Icon
                    name={isCompleted ? 'check-circle' : 'circle-o'}
                    size={15}
                    color={isCompleted ? colors.success[500] : colors.text.secondary}
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuLabel, { color: colors.text.primary }]}>
                    {isCompleted ? t('exam.markIncomplete') : t('exam.markComplete')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  dotsButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 4,
  },
  backdrop: {
    flex: 1,
  },
  menuShadow: {
    position: 'absolute',
    right: 8,
    minWidth: 220,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 14,
  },
  menuInner: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 20,
    textAlign: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    marginLeft: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
});

export default ExamHeaderMenu;
