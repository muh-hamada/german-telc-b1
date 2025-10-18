import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import writingData from '../../data/writing.json';

interface WritingExam {
  id: number;
  title: string;
  incomingEmail: string;
  writingPoints: string[];
}

const WritingScreen: React.FC = () => {
  const { t } = useTranslation();
  const [selectedExamId, setSelectedExamId] = useState<number>(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showWarning, setShowWarning] = useState(false);

  const exams = (writingData as any).exams as WritingExam[];
  const currentExam = exams?.find(e => e.id === selectedExamId) || exams?.[0];
  const currentAnswer = userAnswers[selectedExamId] || '';

  const handleAnswerChange = (text: string) => {
    setUserAnswers(prev => ({ ...prev, [selectedExamId]: text }));
    if (showWarning && text.trim().length >= 50) {
      setShowWarning(false);
    }
  };

  const handleEvaluate = () => {
    if (currentAnswer.trim().length < 50) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);
    setIsResultsModalOpen(true);
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
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsDropdownOpen(false)}
          >
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
          </TouchableOpacity>
        </Modal>
      </>
    );
  };

  const renderResultsModal = () => {
    return (
      <Modal
        visible={isResultsModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsResultsModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsResultsModalOpen(false)}
        >
          <View style={[styles.modalContent, styles.resultsModalContent]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.resultsTitle}>
                Ihre Bewertung (Schriftlicher Ausdruck)
              </Text>

              {/* Overall Score */}
              <View style={styles.overallScoreCard}>
                <Text style={styles.overallScoreTitle}>Gesamtergebnis (Mock Data)</Text>
                <Text style={styles.overallScoreText}>
                  Gesamtpunkte: <Text style={styles.scoreNumber}>15 / 15</Text> (Maximale Punktzahl)
                </Text>
              </View>

              {/* Criteria Header */}
              <Text style={styles.criteriaHeader}>Detaillierte Kriterien:</Text>

              {/* Criterion I - Green */}
              <View style={[styles.criterionCard, styles.criterionGreen]}>
                <Text style={styles.criterionTitle}>
                  Kriterium I: Aufgabenbewältigung (Mock: A)
                </Text>
                <Text style={styles.criterionText}>
                  Alle vier Leitpunkte wurden sinnvoll und verständlich bearbeitet.
                </Text>
              </View>

              {/* Criterion II - Yellow */}
              <View style={[styles.criterionCard, styles.criterionYellow]}>
                <Text style={styles.criterionTitle}>
                  Kriterium II: Kommunikative Gestaltung (Mock: B)
                </Text>
                <Text style={styles.criterionText}>
                  Anrede und Schluss sind passend. Es gibt eine gute Verbindung der Sätze, 
                  aber das Register schwankt leicht.
                </Text>
              </View>

              {/* Criterion III - Red */}
              <View style={[styles.criterionCard, styles.criterionRed]}>
                <Text style={styles.criterionTitle}>
                  Kriterium III: Formale Richtigkeit (Mock: C)
                </Text>
                <Text style={styles.criterionText}>
                  Viele Genusfehler und einige falsche Verbpositionen behindern das zügige 
                  Verständnis stellenweise.
                </Text>
              </View>

              {/* Improvement Tip */}
              <View style={styles.tipCard}>
                <Text style={styles.tipTitle}>Konkreter Verbesserungstipp:</Text>
                <Text style={styles.tipText}>
                  Achten Sie besonders auf die richtige Stellung des Verbs im Nebensatz 
                  (z.B. nach "weil" oder "dass").
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setIsResultsModalOpen(false)}
              >
                <Text style={styles.closeModalButtonText}>Schließen</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Telc B1 Schriftlicher Ausdruck</Text>
          <Text style={styles.headerSubtitle}>
            Übung: Persönliche/Halbformelle E-Mail (30 Minuten)
          </Text>
        </View>

        {/* Exam Selection */}
        <Text style={styles.sectionTitle}>Aufgabe auswählen:</Text>
        <View style={styles.section}>
          {renderExamDropdown()}
        </View>

        {/* Main Content */}
        {currentExam && (
          <View style={styles.mainCard}>
            <Text style={styles.taskTitle}>
              Ihre Aufgabe: Antworten Sie auf die E-Mail
            </Text>

            {/* Incoming Email */}
            <View style={styles.emailCard}>
              <Text style={styles.emailLabel}>Eingegangene Nachricht:</Text>
              <Text style={styles.emailText}>{currentExam.incomingEmail}</Text>
            </View>

            {/* Writing Points */}
            <Text style={styles.pointsTitle}>
              Schreiben Sie etwas zu allen vier Punkten:
            </Text>
            <View style={styles.pointsList}>
              {currentExam.writingPoints.map((point, index) => (
                <View key={index} style={styles.pointItem}>
                  <Text style={styles.pointBullet}>•</Text>
                  <Text style={styles.pointText}>{point}</Text>
                </View>
              ))}
            </View>

            {/* Answer Input */}
            <Text style={styles.answerLabel}>Ihre Antwort (max. 30 Minuten):</Text>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Beginnen Sie mit Betreff, Anrede und schreiben Sie Ihren Text..."
              placeholderTextColor={colors.text.tertiary}
              value={currentAnswer}
              onChangeText={handleAnswerChange}
              textAlignVertical="top"
            />

            {/* Warning Message */}
            {showWarning && (
              <Text style={styles.warningText}>
                Bitte schreiben Sie einen längeren Text (mindestens 50 Zeichen), 
                um eine Bewertung zu starten.
              </Text>
            )}

            {/* Evaluate Button */}
            <TouchableOpacity style={styles.evaluateButton} onPress={handleEvaluate}>
              <Text style={styles.evaluateButtonText}>
                Antwort bewerten lassen (KI-Feedback)
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Results Modal */}
      {renderResultsModal()}
    </SafeAreaView>
  );
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
  header: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.lg,
    marginBottom: spacing.margin.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    ...typography.textStyles.h1,
    color: colors.primary[600],
    textAlign: 'center',
    marginBottom: spacing.margin.xs,
  },
  headerSubtitle: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
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
    flexDirection: 'row',
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
  resultsModalContent: {
    padding: spacing.padding.lg,
  },
  modalHeader: {
    flexDirection: 'row',
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
    flexDirection: 'row',
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
  taskTitle: {
    ...typography.textStyles.h2,
    color: colors.primary[600],
    marginBottom: spacing.margin.lg,
  },
  emailCard: {
    backgroundColor: colors.secondary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.secondary[200],
    marginBottom: spacing.margin.lg,
  },
  emailLabel: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    marginBottom: spacing.margin.sm,
  },
  emailText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  pointsTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[600],
    marginBottom: spacing.margin.md,
  },
  pointsList: {
    marginBottom: spacing.margin.lg,
  },
  pointItem: {
    flexDirection: 'row',
    marginBottom: spacing.margin.sm,
    paddingLeft: spacing.padding.sm,
  },
  pointBullet: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    marginRight: spacing.margin.sm,
    fontWeight: typography.fontWeight.bold,
  },
  pointText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  answerLabel: {
    ...typography.textStyles.h3,
    color: colors.primary[600],
    marginBottom: spacing.margin.sm,
  },
  textInput: {
    backgroundColor: colors.background.primary,
    borderWidth: 2,
    borderColor: colors.secondary[200],
    borderRadius: spacing.borderRadius.md,
    padding: spacing.padding.md,
    minHeight: 200,
    ...typography.textStyles.body,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  warningText: {
    ...typography.textStyles.bodySmall,
    color: colors.error[600],
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.margin.md,
  },
  evaluateButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginTop: spacing.margin.md,
  },
  evaluateButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.secondary,
    textAlign: 'center',
  },
  resultsTitle: {
    ...typography.textStyles.h2,
    color: colors.primary[600],
    marginBottom: spacing.margin.lg,
    paddingBottom: spacing.padding.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[200],
  },
  overallScoreCard: {
    backgroundColor: '#E8E3FF',
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: '#C4B5FD',
    marginBottom: spacing.margin.lg,
  },
  overallScoreTitle: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: '#6D28D9',
    marginBottom: spacing.margin.sm,
  },
  overallScoreText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
  },
  scoreNumber: {
    ...typography.textStyles.h3,
    fontWeight: typography.fontWeight.bold,
    color: colors.success[600],
  },
  criteriaHeader: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    marginBottom: spacing.margin.md,
    paddingBottom: spacing.padding.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  criterionCard: {
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    borderLeftWidth: 4,
  },
  criterionGreen: {
    backgroundColor: '#DCFCE7',
    borderLeftColor: '#22C55E',
  },
  criterionYellow: {
    backgroundColor: '#FEF3C7',
    borderLeftColor: '#EAB308',
  },
  criterionRed: {
    backgroundColor: '#FEE2E2',
    borderLeftColor: '#EF4444',
  },
  criterionTitle: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  criterionText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  tipCard: {
    backgroundColor: colors.secondary[100],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginTop: spacing.margin.sm,
    marginBottom: spacing.margin.lg,
  },
  tipTitle: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  tipText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  closeModalButton: {
    backgroundColor: colors.secondary[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    marginTop: spacing.margin.md,
  },
  closeModalButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.secondary,
    textAlign: 'center',
  },
});

export default WritingScreen;
