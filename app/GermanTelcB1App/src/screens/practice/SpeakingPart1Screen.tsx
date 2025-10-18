import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography } from '../../theme';
import speakingPart1Data from '../../data/speaking-part1.json';

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

const SpeakingPart1Screen: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'introduction' | 'example' | 'vocabulary'>('introduction');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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
    loadPersonalInfo();
  }, []);

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
    if (!personalInfo.name || !personalInfo.origin || !personalInfo.livingSince) {
      Alert.alert('Required Fields', 'Please fill in at least Name, Origin, and Living Since fields.');
      return;
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(personalInfo));
      setShowEditModal(false);
      Alert.alert('Success', 'Personal information saved!');
    } catch (error) {
      console.error('Error saving personal info:', error);
      Alert.alert('Error', 'Failed to save personal information');
    }
  };

  const generateIntroductionText = (): string => {
    if (!personalInfo.name) {
      return 'Please enter your personal information to generate your introduction text.';
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
          <Text style={styles.sectionTitle}>Mein Profil</Text>
          
          <View style={styles.textCard}>
            <Text style={styles.cardTitle}>Persönliche Vorstellung</Text>
            <Text style={styles.introText}>
              {renderFormattedText(introText)}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.infoButton]}
              onPress={() => setShowInfoModal(true)}
            >
              <Text style={styles.buttonText}>View Personal Info</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setShowEditModal(true)}
            >
              <Text style={styles.buttonText}>Edit Info</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderVocabularyTab = () => {
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schlüssel-Vokabular</Text>
          
          <View style={styles.vocabCard}>
            {speakingPart1Data.content.vocabulary.map((item, index) => (
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
          <Text style={styles.sectionTitle}>Vollständiges Beispiel</Text>
          <Text style={styles.exampleNote}>
            This is a complete example of a personal introduction for the TELC B1 oral exam. You can use this as a reference to create your own.
          </Text>
          
          <View style={styles.textCard}>
            <Text style={styles.cardTitle}>Persönliche Vorstellung - Beispiel</Text>
            
            {speakingPart1Data.content.completeExample.map((paragraph, index) => (
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
              <Text style={styles.modalTitle}>Personal Information</Text>
              {personalInfo.name && (
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.name}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, name: text })}
                placeholder="e.g., Muhammad"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.age}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, age: text })}
                placeholder="e.g., 35"
                keyboardType="numeric"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>Birth City</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.birthCity}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, birthCity: text })}
                placeholder="e.g., Kairo"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>Origin (Country) *</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.origin}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, origin: text })}
                placeholder="e.g., Ägypten"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>Living in Germany Since *</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.livingSince}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, livingSince: text })}
                placeholder="e.g., 2016"
                keyboardType="numeric"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>Marital Status</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.maritalStatus}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, maritalStatus: text })}
                placeholder="e.g., verheiratet"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>Family Size</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.familySize}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, familySize: text })}
                placeholder="e.g., eine kleine Familie: meine Frau und zwei Töchter"
                placeholderTextColor={colors.text.tertiary}
                multiline
              />

              <Text style={styles.inputLabel}>Location in Germany</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.location}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, location: text })}
                placeholder="e.g., Charlottenburg"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>Child 1 Age</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.child1Age}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, child1Age: text })}
                placeholder="e.g., acht"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>Child 1 Grade</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.child1Grade}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, child1Grade: text })}
                placeholder="e.g., dritte Klasse"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>Child 2 Age</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.child2Age}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, child2Age: text })}
                placeholder="e.g., drei"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>Profession</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.profession}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, profession: text })}
                placeholder="e.g., Ingenieur"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>Company</Text>
              <TextInput
                style={styles.input}
                value={personalInfo.company}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, company: text })}
                placeholder="e.g., HelloFresh"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={styles.inputLabel}>Hobbies & Free Time</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={personalInfo.hobbies}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, hobbies: text })}
                placeholder="e.g., treibe ich gerne Sport, gehe ins Fitnessstudio..."
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity style={styles.saveButton} onPress={savePersonalInfo}>
                <Text style={styles.saveButtonText}>Save Information</Text>
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
              <Text style={styles.modalTitle}>Your Personal Information</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowInfoModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{personalInfo.name || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Age:</Text>
                <Text style={styles.infoValue}>{personalInfo.age || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Birth City:</Text>
                <Text style={styles.infoValue}>{personalInfo.birthCity || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Origin:</Text>
                <Text style={styles.infoValue}>{personalInfo.origin || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Living Since:</Text>
                <Text style={styles.infoValue}>{personalInfo.livingSince || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Marital Status:</Text>
                <Text style={styles.infoValue}>{personalInfo.maritalStatus || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Family:</Text>
                <Text style={styles.infoValue}>{personalInfo.familySize || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>{personalInfo.location || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Profession:</Text>
                <Text style={styles.infoValue}>{personalInfo.profession || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Company:</Text>
                <Text style={styles.infoValue}>{personalInfo.company || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Hobbies:</Text>
                <Text style={styles.infoValue}>{personalInfo.hobbies || '-'}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Speaking Part 1</Text>
        <Text style={styles.subtitle}>Persönliche Vorstellung</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'introduction' && styles.activeTab]}
          onPress={() => setActiveTab('introduction')}
        >
          <Text
            style={[styles.tabText, activeTab === 'introduction' && styles.activeTabText]}
          >
            My Intro
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'example' && styles.activeTab]}
          onPress={() => setActiveTab('example')}
        >
          <Text
            style={[styles.tabText, activeTab === 'example' && styles.activeTabText]}
          >
            Example
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vocabulary' && styles.activeTab]}
          onPress={() => setActiveTab('vocabulary')}
        >
          <Text
            style={[styles.tabText, activeTab === 'vocabulary' && styles.activeTabText]}
          >
            Vocabulary
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'introduction' && renderIntroductionTab()}
      {activeTab === 'example' && renderCompleteExampleTab()}
      {activeTab === 'vocabulary' && renderVocabularyTab()}

      {renderEditModal()}
      {renderInfoModal()}
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
    backgroundColor: colors.primary[500],
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
});

export default SpeakingPart1Screen;
