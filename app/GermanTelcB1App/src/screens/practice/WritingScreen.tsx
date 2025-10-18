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
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import writingData from '../../data/writing.json';
import WritingUI from '../../components/exam-ui/WritingUI';

interface WritingExam {
  id: number;
  title: string;
  incomingEmail: string;
  writingPoints: string[];
}

const WritingScreen: React.FC = () => {
  const [selectedExamId, setSelectedExamId] = useState<number>(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const exams = (writingData as any).exams as WritingExam[];
  const currentExam = exams?.find(e => e.id === selectedExamId) || exams?.[0];

  const handleComplete = (score: number) => {
    console.log('Writing completed with score:', score);
    // Note: Progress tracking for practice mode can be added here if needed
  };

  const renderExamDropdown = () => {
    if (!exams || exams.length === 0) return null;
    
    return (
      <>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setIsDropdownOpen(true)}
        >
          <Text style={styles.dropdownButtonText}>
            {currentExam?.title || 'Select an exam'}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>

        <Modal
          visible={isDropdownOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsDropdownOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Aufgabe auswählen</Text>
                <TouchableOpacity
                  onPress={() => setIsDropdownOpen(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={exams}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      selectedExamId === item.id && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setSelectedExamId(item.id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedExamId === item.id && styles.dropdownItemTextActive,
                      ]}
                    >
                      {item.title}
                    </Text>
                    {selectedExamId === item.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </>
    );
  };

  if (!currentExam) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No exam data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Writing Section</Text>
        <Text style={styles.subtitle}>Compose an email response</Text>
      </View>

      <View style={styles.dropdownContainer}>
        {renderExamDropdown()}
      </View>

      <WritingUI exam={currentExam} onComplete={handleComplete} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.textStyles.body,
    color: colors.error[500],
  },
  header: {
    backgroundColor: colors.primary[500],
    padding: spacing.padding.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.textStyles.h2,
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.textStyles.body,
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.margin.xs,
    opacity: 0.9,
  },
  dropdownContainer: {
    padding: spacing.padding.lg,
    backgroundColor: colors.background.secondary,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  dropdownButtonText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  dropdownArrow: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: spacing.borderRadius.lg,
    width: '85%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    ...typography.textStyles.h4,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.padding.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
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
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
  },
  checkmark: {
    ...typography.textStyles.body,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.bold,
  },
});

export default WritingScreen;

