import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography } from '../../theme';
import dataService from '../../services/data.service';
import { useExamCompletion } from '../../contexts/CompletionContext';
import AdBanner from '../../components/AdBanner';
import { HIDE_ADS } from '../../config/demo.config';

interface PersonalInfo {
  name: string;
  age: string;
  birthCity: string;
  origin: string;
  livingSince: string;
  maritalStatus: string;
  familySize: string;
  location: string;
  child1Age: string;
  child1Grade: string;
  child2Age: string;
  profession: string;
  company: string;
  hobbies: string;
}

const STORAGE_KEY = '@speaking_part1_personal_info';

const mandatoryFields = ['name', 'origin', 'livingSince'] as const;

const SpeakingPart1Screen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isCompleted, toggleCompletion } = useExamCompletion('speaking', 1, 0);
  
  const [activeTab, setActiveTab] = useState<'introduction' | 'example' | 'vocabulary'>('introduction');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [speakingPart1Data, setSpeakingPart1Data] = useState<any>(null);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: '',
    age: '',
    birthCity: '',
    origin: '',
    livingSince: '',
    maritalStatus: '',
    familySize: '',
    location: '',
    child1Age: '',
    child1Grade: '',
    child2Age: '',
    profession: '',
    company: '',
    hobbies: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  // Set up header button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleToggleCompletion}
          style={styles.headerButton}
        >
          <Icon
            name={isCompleted ? 'check-circle' : 'circle-o'}
            size={24}
            color={isCompleted ? colors.success[500] : colors.white}
          />
        </TouchableOpacity>
      ),
    });
  }, [isCompleted, navigation]);

  const handleToggleCompletion = async () => {
    try {
      const newStatus = await toggleCompletion(0); // Speaking doesn't have a score
      Alert.alert(
        t('common.success'),
        newStatus ? t('exam.markedCompleted') : t('exam.markedIncomplete')
      );
    } catch (error: any) {
      if (error.message === 'auth/not-logged-in') {
        Alert.alert(t('common.error'), t('exam.loginToSaveProgress'));
      } else {
        Alert.alert(t('common.error'), t('exam.completionFailed'));
      }
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await dataService.getSpeakingPart1Content();
      setSpeakingPart1Data(data);
      await loadPersonalInfo();
    } catch (error) {
      console.error('Error loading speaking part 1 data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPersonalInfo = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPersonalInfo(JSON.parse(stored));
      } else {
        // Show modal for first-time users
        setShowEditModal(true);
      }
    } catch (error) {
      console.error('Error loading personal info:', error);
    }
  };

  const savePersonalInfo = async () => {
    // Validate required fields
    if (mandatoryFields.some(field => !personalInfo[field])) {
      Alert.alert(t('common.alerts.requiredFields'), t('common.alerts.fillNameOriginLiving'));
      return;
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(personalInfo));
      setShowEditModal(false);
      Alert.alert(t('common.success'), t('common.alerts.infoSaved'));
    } catch (error) {
      console.error('Error saving personal info:', error);
      Alert.alert(t('common.error'), t('common.alerts.failedToSave'));
    }
  };

  const generateIntroductionText = (): string => {
    if (mandatoryFields.some(field => !personalInfo[field])) {
      return ''; // Return empty string instead of null to avoid type errors
    }

    let text = `**Guten Tag!** Mein Name ist **${personalInfo.name}**`;

    if (personalInfo.origin) {
      text += ` und ich **komme aus ${personalInfo.origin}**`;
    }

    text += '.';

    if (personalInfo.birthCity) {
      text += ` Ich **wurde in ${personalInfo.birthCity} geboren**`;
    }

    if (personalInfo.age) {
      text += ` und bin **${personalInfo.age} Jahre alt**`;
    }

    text += '.';

    if (personalInfo.livingSince) {
      text += ` Ich **lebe seit ${personalInfo.livingSince} in Deutschland**.`;
    }

    if (personalInfo.maritalStatus) {
      text += ` Ich **bin ${personalInfo.maritalStatus}**`;
    }

    if (personalInfo.familySize) {
      text += ` und habe **${personalInfo.familySize}**`;
    }

    text += '.\n\n';

    // Family section
    if (personalInfo.location) {
      text += `Wir **wohnen in ${personalInfo.location}**.`;
    }

    if (personalInfo.child1Age && personalInfo.child1Grade) {
      text += ` Meine ältere **Tochter** ist **${personalInfo.child1Age} Jahre alt** und **geht in die ${personalInfo.child1Grade}**.`;
    }

    if (personalInfo.child2Age) {
      text += ` Meine jüngere Tochter ist **${personalInfo.child2Age} Jahre alt** und **besucht den Kindergarten**.`;
    }

    text += '\n\n';

    // Professional section
    if (personalInfo.profession) {
      text += `**Beruflich bin ich ${personalInfo.profession}**`;
    }

    if (personalInfo.company) {
      text += ` und **arbeite bei ${personalInfo.company}**`;
    }

    text += '.';

    if (personalInfo.hobbies) {
      text += ` **In meiner Freizeit ${personalInfo.hobbies}**.`;
    }

    return text;
  };

  const renderIntroductionTab = () => {
    const introText = generateIntroductionText();

    // Split text by ** markers for bold formatting
    const renderFormattedText = (text: string) => {
      if (!text) return null;

      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const content = part.slice(2, -2);
          return (
            <Text key={index} style={styles.boldText}>
              {content}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      });
    };

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speaking.part1.sections.myProfile')}</Text>

          <View style={styles.textCard}>
            <Text style={styles.cardTitle}>{t('speaking.part1.sections.personalIntro')}</Text>
            {introText !== '' ? (
              <Text style={styles.introText}>
                {renderFormattedText(introText)}
              </Text>
            ) : (
              <Text style={styles.introText}>{t('speaking.part1.help.enterInfoPrompt')}</Text>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.infoButton]}
              onPress={() => setShowInfoModal(true)}
            >
              <Text style={styles.buttonText}>{t('speaking.part1.buttons.viewInfo')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setShowEditModal(true)}
            >
              <Text style={styles.buttonText}>{t('speaking.part1.buttons.editInfo')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderVocabularyTab = () => {
    if (!speakingPart1Data) return null;
    
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speaking.part1.sections.keyVocabulary')}</Text>

          <View style={styles.vocabCard}>
            {speakingPart1Data.vocabulary.map((item, index) => (
              <View key={index} style={styles.vocabRow}>
                <View style={styles.vocabColumn}>
                  <Text style={styles.vocabGerman}>{item.german}</Text>
                </View>
                <View style={styles.vocabColumn}>
                  <Text style={styles.vocabEnglish}>{item.english}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderCompleteExampleTab = () => {
    if (!speakingPart1Data) return null;
    
    // Split text by ** markers for bold formatting
    const renderFormattedText = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const content = part.slice(2, -2);
          return (
            <Text key={index} style={styles.boldText}>
              {content}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      });
    };

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speaking.part1.sections.completeExample')}</Text>
          <Text style={styles.exampleNote}>
            {t('speaking.part1.help.exampleNote')}
          </Text>

          <View style={styles.textCard}>
            <Text style={styles.cardTitle}>{t('speaking.part1.sections.personalIntro')} - {t('speaking.part1.tabs.example')}</Text>

            {speakingPart1Data.completeExample.map((paragraph, index) => (
              <Text key={index} style={styles.exampleParagraph}>
                {renderFormattedText(paragraph)}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderEditModal = () => {
    return (
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (personalInfo.name) {
            setShowEditModal(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('speaking.part1.modal.personalInfo')}</Text>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <Text style={styles.inputLabel}>{t('common.labels.name')} {mandatoryFields.includes('name') ? '*' : ''}</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.name}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, name: text })}
                placeholder={t('common.placeholders.exampleMuhammad')}
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>{t('common.labels.age')}</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.age}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, age: text })}
                placeholder={t('common.placeholders.example35')}
                keyboardType="numeric"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>{t('common.labels.birthCity')}</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.birthCity}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, birthCity: text })}
                placeholder={t('common.placeholders.exampleKairo')}
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>{t('common.labels.origin')} {mandatoryFields.includes('origin') ? '*' : ''}</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.origin}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, origin: text })}
                placeholder={t('common.placeholders.exampleEgypt')}
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>{t('common.labels.livingSince')} {mandatoryFields.includes('livingSince') ? '*' : ''}</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.livingSince}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, livingSince: text })}
                placeholder={t('common.placeholders.example2016')}
                keyboardType="numeric"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>{t('common.labels.maritalStatus')}</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.maritalStatus}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, maritalStatus: text })}
                placeholder={t('common.placeholders.exampleMarried')}
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>{t('common.labels.familySize')}</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.familySize}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, familySize: text })}
                placeholder={t('common.placeholders.exampleFamily')}
                placeholderTextColor={colors.text.tertiary}
                multiline
              />

              <Text style={styles.inputLabel}>{t('common.labels.location')}</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.location}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, location: text })}
                placeholder={t('common.placeholders.exampleCharlottenburg')}
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>{t('common.labels.child1Age')}</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.child1Age}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, child1Age: text })}
                placeholder={t('common.placeholders.exampleEight')}
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>{t('common.labels.child1Grade')}</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.child1Grade}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, child1Grade: text })}
                placeholder={t('common.placeholders.exampleThirdGrade')}
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>{t('common.labels.child2Age')}</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.child2Age}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, child2Age: text })}
                placeholder={t('common.placeholders.exampleThree')}
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>{t('common.labels.profession')}</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.profession}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, profession: text })}
                placeholder={t('common.placeholders.exampleEngineer')}
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>{t('common.labels.company')}</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.company}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, company: text })}
                placeholder={t('common.placeholders.exampleHelloFresh')}
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>{t('common.labels.hobbies')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={personalInfo.hobbies}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, hobbies: text })}
                placeholder={t('common.placeholders.exampleHobbies')}
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity style={styles.saveButton} onPress={savePersonalInfo}>
                <Text style={styles.saveButtonText}>{t('speaking.part1.buttons.saveInfo')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderInfoModal = () => {
    return (
      <Modal
        visible={showInfoModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('speaking.part1.modal.yourPersonalInfo')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowInfoModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('speaking.part1.infoLabels.name')}</Text>
                <Text style={styles.infoValue}>{personalInfo.name || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('speaking.part1.infoLabels.age')}</Text>
                <Text style={styles.infoValue}>{personalInfo.age || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('speaking.part1.infoLabels.birthCity')}</Text>
                <Text style={styles.infoValue}>{personalInfo.birthCity || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('speaking.part1.infoLabels.origin')}</Text>
                <Text style={styles.infoValue}>{personalInfo.origin || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('speaking.part1.infoLabels.livingSince')}</Text>
                <Text style={styles.infoValue}>{personalInfo.livingSince || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('speaking.part1.infoLabels.maritalStatus')}</Text>
                <Text style={styles.infoValue}>{personalInfo.maritalStatus || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('speaking.part1.infoLabels.family')}</Text>
                <Text style={styles.infoValue}>{personalInfo.familySize || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('speaking.part1.infoLabels.location')}</Text>
                <Text style={styles.infoValue}>{personalInfo.location || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('speaking.part1.infoLabels.profession')}</Text>
                <Text style={styles.infoValue}>{personalInfo.profession || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('speaking.part1.infoLabels.company')}</Text>
                <Text style={styles.infoValue}>{personalInfo.company || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('speaking.part1.infoLabels.hobbies')}</Text>
                <Text style={styles.infoValue}>{personalInfo.hobbies || '-'}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'introduction' && styles.activeTab]}
          onPress={() => setActiveTab('introduction')}
        >
          <Text
            style={[styles.tabText, activeTab === 'introduction' && styles.activeTabText]}
          >
            {t('speaking.part1.tabs.myIntro')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'example' && styles.activeTab]}
          onPress={() => setActiveTab('example')}
        >
          <Text
            style={[styles.tabText, activeTab === 'example' && styles.activeTabText]}
          >
            {t('speaking.part1.tabs.example')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vocabulary' && styles.activeTab]}
          onPress={() => setActiveTab('vocabulary')}
        >
          <Text
            style={[styles.tabText, activeTab === 'vocabulary' && styles.activeTabText]}
          >
            {t('speaking.part1.tabs.vocabulary')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'introduction' && renderIntroductionTab()}
      {activeTab === 'example' && renderCompleteExampleTab()}
      {activeTab === 'vocabulary' && renderVocabularyTab()}

      {renderEditModal()}
      {renderInfoModal()}
      {!HIDE_ADS && <AdBanner />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.padding.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  activeTabText: {
    color: colors.primary[500],
    fontWeight: typography.fontWeight.bold,
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
    marginBottom: spacing.margin.md,
  },
  cardTitle: {
    ...typography.textStyles.h4,
    color: colors.primary[500],
    marginBottom: spacing.margin.md,
  },
  introText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 26,
  },
  boldText: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  exampleNote: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    fontStyle: 'italic' as 'italic',
    marginBottom: spacing.margin.md,
    paddingHorizontal: spacing.padding.xs,
  },
  exampleParagraph: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 26,
    marginBottom: spacing.margin.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.margin.md,
  },
  button: {
    flex: 1,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
  },
  infoButton: {
    backgroundColor: colors.primary[100],
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  editButton: {
    backgroundColor: colors.primary[200],
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  buttonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  vocabCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.padding.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vocabRow: {
    flexDirection: 'row',
    paddingVertical: spacing.padding.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  vocabColumn: {
    flex: 1,
    paddingHorizontal: spacing.padding.xs,
  },
  vocabGerman: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  vocabEnglish: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.xl,
    width: '90%',
    maxHeight: '85%',
    padding: spacing.padding.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.margin.md,
    paddingBottom: spacing.padding.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[500],
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    ...typography.textStyles.h3,
    color: colors.text.secondary,
  },
  modalScrollContent: {
    paddingBottom: spacing.padding.lg,
  },
  inputLabel: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
    marginTop: spacing.margin.sm,
  },
  input: {
    ...typography.textStyles.body,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.padding.sm,
    color: colors.text.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: colors.primary[500],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.margin.lg,
  },
  saveButtonText: {
    ...typography.textStyles.h4,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: spacing.padding.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoLabel: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    width: 120,
  },
  infoValue: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    flex: 1,
  },
  headerButton: {
    padding: spacing.padding.sm,
    marginRight: spacing.margin.sm,
  },
});

export default SpeakingPart1Screen;
