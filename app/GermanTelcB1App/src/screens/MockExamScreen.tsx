import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../theme';
import { MOCK_EXAM_STEPS } from '../types/mock-exam.types';
import { 
  loadMockExamProgress, 
  clearMockExamProgress,
  createInitialMockExamProgress,
  saveMockExamProgress,
} from '../services/mock-exam.service';

type RootStackParamList = {
  MockExamRunning: undefined;
  ExamStructure: undefined;
};

const MockExamScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkForActiveExam();
  }, []);

  const checkForActiveExam = async () => {
    try {
      const progress = await loadMockExamProgress();
      if (progress && !progress.isCompleted) {
        // Show alert to continue or start new
        Alert.alert(
          'Prüfung in Bearbeitung',
          'Sie haben bereits eine Mock-Prüfung begonnen. Möchten Sie diese fortsetzen oder eine neue Prüfung beginnen?',
          [
            {
              text: 'Fortsetzen',
              onPress: () => navigation.navigate('MockExamRunning'),
            },
            {
              text: 'Neu beginnen',
              onPress: () => confirmStartNew(),
              style: 'destructive',
            },
            {
              text: 'Abbrechen',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error checking for active exam:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmStartNew = () => {
    Alert.alert(
      'Bestätigen',
      'Sind Sie sicher, dass Sie eine neue Prüfung beginnen möchten? Ihr aktueller Fortschritt wird gelöscht.',
      [
        {
          text: 'Ja, neu beginnen',
          onPress: async () => {
            await clearMockExamProgress();
            handleStartExam();
          },
          style: 'destructive',
        },
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
      ]
    );
  };

  const handleStartExam = async () => {
    try {
      // Create and save initial progress
      const initialProgress = createInitialMockExamProgress();
      await saveMockExamProgress(initialProgress);
      navigation.navigate('MockExamRunning');
    } catch (error) {
      console.error('Error starting exam:', error);
      Alert.alert('Fehler', 'Die Prüfung konnte nicht gestartet werden. Bitte versuchen Sie es erneut.');
    }
  };

  const handleViewStructure = () => {
    navigation.navigate('ExamStructure');
  };

  const totalTime = MOCK_EXAM_STEPS.reduce((acc, step) => acc + (step.timeMinutes || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📝 Mock Exam</Text>
          <Text style={styles.subtitle}>Telc Deutsch B1 Vollständige Prüfung</Text>
        </View>

        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Prüfungsübersicht</Text>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>⏱️ Gesamtdauer:</Text>
            <Text style={styles.overviewValue}>{totalTime} Minuten</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>📊 Gesamtpunkte:</Text>
            <Text style={styles.overviewValue}>300 Punkte</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>✅ Bestehensgrenze:</Text>
            <Text style={styles.overviewValue}>180 Punkte (60%)</Text>
          </View>
        </View>

        {/* Important Note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>⚠️ Wichtiger Hinweis:</Text>
          <Text style={styles.noteText}>
            Bevor Sie mit der Prüfung beginnen, empfehlen wir Ihnen dringend, die Prüfungsstruktur 
            zu überprüfen, um sich mit dem Format und den Anforderungen vertraut zu machen.
          </Text>
          <TouchableOpacity style={styles.linkButton} onPress={handleViewStructure}>
            <Text style={styles.linkButtonText}>📖 Prüfungsstruktur ansehen</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>ℹ️ Über diese Mock-Prüfung</Text>
          <Text style={styles.disclaimerText}>
            Diese Mock-Prüfung gibt Ihnen eine grobe Einschätzung Ihres aktuellen Kenntnisstands 
            und Ihrer Vorbereitung. Sie ist jedoch{' '}
            <Text style={styles.disclaimerBold}>keine Garantie</Text> dafür, dass Sie die 
            echte Telc B1-Prüfung bestehen werden.
          </Text>
          <Text style={styles.disclaimerText}>
            {'\n'}Die echte Prüfung wird unter kontrollierten Bedingungen durchgeführt und von 
            zertifizierten Prüfern bewertet. Nutzen Sie diese Mock-Prüfung als Übungswerkzeug, 
            um Ihre Schwachstellen zu identifizieren und gezielt zu verbessern.
          </Text>
        </View>

        {/* Exam Sections */}
        <View style={styles.sectionsCard}>
          <Text style={styles.cardTitle}>Prüfungsteile:</Text>
          
          <View style={styles.sectionItem}>
            <Text style={styles.sectionNumber}>1</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Leseverstehen (3 Teile)</Text>
              <Text style={styles.sectionDetail}>90 Min • 75 Punkte</Text>
            </View>
          </View>

          <View style={styles.sectionItem}>
            <Text style={styles.sectionNumber}>2</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Sprachbausteine (2 Teile)</Text>
              <Text style={styles.sectionDetail}>90 Min • 30 Punkte</Text>
            </View>
          </View>

          <View style={styles.sectionItem}>
            <Text style={styles.sectionNumber}>3</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Hörverstehen (3 Teile)</Text>
              <Text style={styles.sectionDetail}>30 Min • 75 Punkte</Text>
            </View>
          </View>

          <View style={styles.sectionItem}>
            <Text style={styles.sectionNumber}>4</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Schriftlicher Ausdruck</Text>
              <Text style={styles.sectionDetail}>30 Min • 45 Punkte</Text>
            </View>
          </View>

          <View style={styles.sectionItem}>
            <Text style={styles.sectionNumber}>5</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Mündlicher Ausdruck (3 Teile)</Text>
              <Text style={styles.sectionDetail}>15 Min • 75 Punkte (Übung empfohlen)</Text>
            </View>
          </View>
        </View>

        {/* Speaking Note */}
        <View style={styles.speakingNote}>
          <Text style={styles.speakingNoteTitle}>🗣️ Hinweis zur mündlichen Prüfung:</Text>
          <Text style={styles.speakingNoteText}>
            Die mündliche Prüfung erfordert menschliche Interaktion und kann nicht in dieser 
            Mock-Prüfung simuliert werden. Wir empfehlen Ihnen, den Übungsbereich zu nutzen 
            und mit einem Freund, Sprachpartner oder Tutor zu üben.
          </Text>
        </View>

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartExam}>
          <Text style={styles.startButtonText}>🚀 Mock-Prüfung starten</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Viel Erfolg! Nehmen Sie sich Zeit und lesen Sie alle Anweisungen sorgfältig.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
    paddingBottom: spacing.padding.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.margin.xl,
  },
  title: {
    ...typography.textStyles.h1,
    color: colors.primary[600],
    marginBottom: spacing.margin.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  overviewCard: {
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
  cardTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.margin.sm,
  },
  overviewLabel: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  overviewValue: {
    ...typography.textStyles.body,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
  noteCard: {
    backgroundColor: colors.warning[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[500],
  },
  noteTitle: {
    ...typography.textStyles.h4,
    color: colors.warning[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
  },
  noteText: {
    ...typography.textStyles.body,
    color: colors.warning[700],
    lineHeight: 22,
    marginBottom: spacing.margin.sm,
  },
  linkButton: {
    marginTop: spacing.margin.sm,
  },
  linkButtonText: {
    ...typography.textStyles.body,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
    textDecorationLine: 'underline',
  },
  disclaimerCard: {
    backgroundColor: colors.primary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  disclaimerTitle: {
    ...typography.textStyles.h4,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
  },
  disclaimerText: {
    ...typography.textStyles.body,
    color: colors.primary[700],
    lineHeight: 22,
  },
  disclaimerBold: {
    fontWeight: typography.fontWeight.bold,
  },
  sectionsCard: {
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
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.margin.md,
  },
  sectionNumber: {
    ...typography.textStyles.h2,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.bold,
    width: 40,
    marginRight: spacing.margin.sm,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
  },
  sectionDetail: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  speakingNote: {
    backgroundColor: colors.secondary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary[500],
  },
  speakingNoteTitle: {
    ...typography.textStyles.h4,
    color: colors.secondary[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
  },
  speakingNoteText: {
    ...typography.textStyles.body,
    color: colors.secondary[700],
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: colors.success[500],
    paddingVertical: spacing.padding.lg,
    paddingHorizontal: spacing.padding.xl,
    borderRadius: spacing.borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.margin.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    ...typography.textStyles.h3,
    color: colors.background.secondary,
    fontWeight: typography.fontWeight.bold,
  },
  disclaimer: {
    ...typography.textStyles.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MockExamScreen;
