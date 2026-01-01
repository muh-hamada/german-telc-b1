import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import Sound from 'react-native-nitro-sound';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { SpeakingDialogueTurn } from '../../types/prep-plan.types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LanguageCode } from '../../config/exam-config.types';
import { getActiveExamConfig } from '../../config/active-exam.config';
import { LanguageNameToLanguageCodes } from '../../utils/i18n';
import { useAppTheme } from '../../contexts/ThemeContext';
import { type ThemeColors } from '../../theme';

interface SpeakingDialogueComponentProps {
  dialogue: SpeakingDialogueTurn[];
  currentTurnIndex: number;
  onComplete: () => void;
  onTurnComplete: (turnIndex: number, audioUrl: string) => void;
  onNextTurn: () => void;
}

export const SpeakingDialogueComponent: React.FC<SpeakingDialogueComponentProps> = ({
  dialogue,
  currentTurnIndex,
  onComplete,
  onTurnComplete,
  onNextTurn,
}) => {
  const { t, i18n } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [isStoppingRecording, setIsStoppingRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null); // null means not checked yet
  const [recordingDuration, setRecordingDuration] = useState(0);

  const soundPlayerRef = useRef<typeof Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentTurn = dialogue[currentTurnIndex];
  const isUserTurn = currentTurn?.speaker === 'user';
  const isDialogueComplete = currentTurnIndex >= dialogue.length;

  const activeExamConfig = getActiveExamConfig();

  const examLangCode = LanguageNameToLanguageCodes[activeExamConfig.language] as LanguageCode;
  const interfaceLangCode = i18n.language as LanguageCode;

  const examInstruction = isUserTurn && currentTurn.instruction ? currentTurn.instruction[examLangCode] : '';

  const interfaceInstruction = isUserTurn && currentTurn.instruction && examLangCode !== interfaceLangCode ? currentTurn.instruction[interfaceLangCode] : '';

  useEffect(() => {
    // Request permission when component mounts
    requestMicrophonePermission();
    return () => {
      if (soundPlayerRef.current) {
        Sound.stopPlayer();
      }
      Sound.stopRecorder().catch(() => { });
      Sound.removeRecordBackListener();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentTurnIndex >= dialogue.length) {
      // onComplete();
    }
  }, [currentTurnIndex, dialogue.length, onComplete]);

  const requestMicrophonePermission = async () => {
    try {
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.MICROPHONE
        : PERMISSIONS.ANDROID.RECORD_AUDIO;

      // Check current permission status
      const checkResult = await check(permission);

      if (checkResult === RESULTS.GRANTED) {
        setHasPermission(true);
        return;
      }

      if (checkResult === RESULTS.BLOCKED || checkResult === RESULTS.UNAVAILABLE) {
        setHasPermission(false);
        Alert.alert(
          t('speaking.permissions.denied'),
          t('speaking.permissions.deniedMessage'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('settings.openSettings'), onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      // Request permission
      const requestResult = await request(permission);
      const hasGranted = requestResult === RESULTS.GRANTED;
      setHasPermission(hasGranted);

      if (!hasGranted) {
        Alert.alert(
          t('speaking.permissions.denied'),
          t('speaking.permissions.deniedMessage'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('settings.openSettings'), onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (err) {
      console.error('Permission request error:', err);
      setHasPermission(false);
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      Alert.alert(t('speaking.permissions.denied'), t('speaking.permissions.deniedMessage'));
      return;
    }

    try {
      // Update state immediately for better UX
      setIsStartingRecording(true);
      
      console.log('[SpeakingDialogue] Starting recording...');
      await Sound.stopPlayer();
      const audioPath = await Sound.startRecorder();
      console.log('[SpeakingDialogue] Recording started, path:', audioPath);

      Sound.addRecordBackListener((e: any) => {
        const seconds = Math.floor(e.currentPosition / 1000);
        setRecordingDuration(seconds);
      });

      setIsRecording(true);
      setIsStartingRecording(false);
    } catch (error) {
      console.error('Start recording error:', error);
      Alert.alert(t('speaking.error'), t('speaking.recordingError'));
      setIsRecording(false);
      setIsStartingRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      // Update state immediately for better UX
      setIsStoppingRecording(true);
      
      console.log(`[SpeakingDialogue] Stopping recording... Duration: ${recordingDuration}s`);
      const audioPath = await Sound.stopRecorder();
      Sound.removeRecordBackListener();

      setIsRecording(false);
      setIsStoppingRecording(false);
      setRecordingDuration(0);

      if (audioPath) {
        processRecording(audioPath);
      } else {
        Alert.alert(t('speaking.error'), t('speaking.recordingError'));
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert(t('speaking.error'), t('speaking.recordingError'));
      setIsRecording(false);
      setIsStoppingRecording(false);
    }
  };

  const processRecording = async (audioPath: string) => {
    setIsProcessing(true);
    try {
      await onTurnComplete(currentTurnIndex, audioPath);
      setIsProcessing(false);
      setRecordingDuration(0);
    } catch (error: any) {
      console.error('Processing error:', error);
      let errorMessage = t('speaking.processingError');
      if (error.message?.includes('timeout')) errorMessage = t('speaking.uploadTimeout');
      else if (error.message?.includes('network')) errorMessage = t('speaking.networkError');
      Alert.alert(t('speaking.error'), errorMessage);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Automatically play AI audio when turn changes to AI
    // But only if we have permission granted (to avoid playing while permission dialog is showing)
    if (!isUserTurn && currentTurn && (currentTurn.audioUrl || currentTurn.audio_url) && hasPermission === true) {
      playAIResponse();
    }
  }, [currentTurnIndex, hasPermission]);

  const playAIResponse = async () => {
    const url = currentTurn?.audioUrl || currentTurn?.audio_url;
    console.log('Playing AI response for turn:', url);
    if (!url) return;

    setIsPlaying(true);
    try {
      await Sound.startPlayer(url);
      Sound.addPlaybackEndListener(() => {
        setIsPlaying(false);
      });
      soundPlayerRef.current = Sound;
    } catch (error) {
      console.error('Play audio error:', error);
      setIsPlaying(false);
      // Don't alert on auto-play failure to avoid interrupting the flow
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = async () => {
    try {
      await Sound.stopPlayer();
      setIsPlaying(false);
    } catch (error) {
      console.error('Error stopping player on next:', error);
    }
    onNextTurn();
  };

  if (hasPermission === null) {
    // Still checking permissions
    return (
      <View style={styles.contentContainer}>
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.permissionText}>{t('speaking.permissions.checking')}</Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    // Permission denied or not granted
    return (
      <View style={styles.contentContainer}>
        <View style={styles.permissionContainer}>
          <Icon name="mic-off" size={64} color={colors.text.tertiary} />
          <Text style={styles.permissionText}>{t('speaking.permissions.required')}</Text>
        </View>
        <TouchableOpacity style={styles.permissionButton} onPress={requestMicrophonePermission}>
          <Text style={styles.permissionButtonText}>{t('speaking.permissions.grant')}</Text>
        </TouchableOpacity>
      </View >
    );
  }

  if (isDialogueComplete) {
    return (
      <View style={styles.container}>
        <Icon name="check-circle" size={64} color={colors.success[500]} />
        <Text style={styles.completeText}>{t('speaking.complete')}</Text>
        <Text style={styles.completeSubtext}>{t('speaking.evaluating')}</Text>
        <ActivityIndicator size="large" color={colors.primary[500]} style={styles.loader} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>{t('speaking.turn')} {currentTurnIndex + 1} / {dialogue.length}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentTurnIndex + 1) / dialogue.length) * 100}%` }]} />
        </View>
      </View>

      <View style={styles.turnContainer}>
        <View style={[styles.turnCard, isUserTurn ? styles.userTurnCard : styles.aiTurnCard]}>
          <View style={styles.turnHeader}>
            <View style={styles.speakerInfo}>
              <Icon name={isUserTurn ? "person" : "psychology"} size={24} color={isUserTurn ? colors.primary[500] : colors.primary[600]} />
              <Text style={styles.turnSpeaker}>{isUserTurn ? t('speaking.you') : t('speaking.ai')}</Text>
            </View>
            {!isUserTurn && (currentTurn?.audioUrl || currentTurn?.audio_url) && (
              <TouchableOpacity
                style={[styles.replayIconButton, isPlaying && styles.replayIconButtonActive]}
                onPress={playAIResponse}
                disabled={isPlaying}
              >
                <Icon name={isPlaying ? "volume-up" : "play-arrow"} size={20} color={isPlaying ? colors.primary[600] : colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
          <View>
            <Text style={styles.turnText}>{isUserTurn ? examInstruction : currentTurn?.text}</Text>
            {isUserTurn && !!interfaceInstruction && (
              <Text style={styles.secondaryInstructionText}>{interfaceInstruction}</Text>
            )}
          </View>
          {!isUserTurn && currentTurn?.audioUrl && (
            <TouchableOpacity style={[styles.playButton, isPlaying && styles.playButtonDisabled]} onPress={playAIResponse} disabled={isPlaying}>
              <Icon name={isPlaying ? "volume-up" : "play-arrow"} size={24} color={colors.text.inverse} />
              <Text style={styles.playButtonText}>{isPlaying ? t('speaking.playing') : t('speaking.playAudio')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isUserTurn && (
        <View style={styles.recordingControls}>
          {!isRecording && !isProcessing && !isStartingRecording && (
            <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
              <Icon name="mic" size={32} color={colors.text.inverse} />
              <Text style={styles.recordButtonText}>{t('speaking.startRecording')}</Text>
            </TouchableOpacity>
          )}
          {isStartingRecording && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.loadingText}>{t('speaking.preparing')}</Text>
            </View>
          )}
          {isRecording && !isStoppingRecording && (
            <View style={styles.recordingActive}>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>{t('speaking.recording')}</Text>
              </View>
              <Text style={styles.recordingTime}>{formatTime(recordingDuration)}</Text>
              <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                <Icon name="stop" size={32} color={colors.text.inverse} />
                <Text style={styles.stopButtonText}>{t('speaking.stopRecording')}</Text>
              </TouchableOpacity>
            </View>
          )}
          {isStoppingRecording && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.loadingText}>{t('speaking.stopping')}</Text>
            </View>
          )}
          {isProcessing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.processingText}>{t('speaking.processing')}</Text>
            </View>
          )}
        </View>
      )}

      {!isUserTurn && (
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>{t('speaking.next')}</Text>
          <Icon name="arrow-forward" size={20} color={colors.text.inverse} />
        </TouchableOpacity>
      )}

      {currentTurnIndex > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>{t('speaking.previousTurns')}</Text>
          {dialogue.slice(Math.max(0, currentTurnIndex - 3), currentTurnIndex).map((turn, index) => {
            const isTurnUser = turn.speaker === 'user';

            return (
              <View key={index} style={[styles.historyTurn, isTurnUser ? styles.historyUserTurn : styles.historyAiTurn]}>
                <Text style={styles.historyTurnSpeaker}>{isTurnUser ? t('speaking.you') : t('speaking.ai')}:</Text>
                <View>
                  <Text style={styles.historyTurnText}>
                    {isTurnUser ? turn.transcription : turn.text}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  contentContainer: { padding: 16 },
  permissionContainer: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  progressContainer: { marginBottom: 20 },
  progressText: { fontSize: 14, color: colors.text.secondary, marginBottom: 8, textAlign: 'center' },
  progressBar: { height: 4, backgroundColor: colors.border.light, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary[500], borderRadius: 2 },
  turnContainer: { marginBottom: 24 },
  turnCard: { padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  userTurnCard: { backgroundColor: colors.background.secondary, borderLeftWidth: 4, borderLeftColor: colors.primary[500] },
  aiTurnCard: { backgroundColor: colors.background.secondary, borderLeftWidth: 4, borderLeftColor: colors.primary[600] },
  turnHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  speakerInfo: { flexDirection: 'row', alignItems: 'center' },
  turnSpeaker: { fontSize: 16, fontWeight: '600', marginLeft: 8, color: colors.text.primary },
  replayIconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
  },
  replayIconButtonActive: {
    backgroundColor: colors.primary[50],
  },
  turnText: { fontSize: 16, color: colors.text.primary, lineHeight: 24 },
  secondaryInstructionText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  playButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary[600], padding: 12, borderRadius: 8, marginTop: 12 },
  playButtonDisabled: { opacity: 0.6 },
  playButtonText: { color: colors.text.inverse, fontSize: 14, fontWeight: '600', marginLeft: 8 },
  recordingControls: { marginBottom: 24 },
  recordButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.error[500], padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  recordButtonText: { color: colors.text.inverse, fontSize: 16, fontWeight: '600', marginLeft: 12 },
  recordingActive: { alignItems: 'center' },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  recordingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.error[500], marginRight: 8 },
  recordingText: { fontSize: 16, color: colors.error[500], fontWeight: '600' },
  recordingTime: { fontSize: 32, fontWeight: '700', color: colors.text.primary, marginBottom: 16 },
  stopButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.error[500], padding: 20, borderRadius: 12, width: '100%' },
  stopButtonText: { color: colors.text.inverse, fontSize: 16, fontWeight: '600', marginLeft: 12 },
  loadingContainer: { alignItems: 'center', padding: 24 },
  loadingText: { fontSize: 14, color: colors.text.secondary, marginTop: 12 },
  processingContainer: { alignItems: 'center', padding: 24 },
  processingText: { fontSize: 14, color: colors.text.secondary, marginTop: 12 },
  nextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary[500], padding: 16, borderRadius: 12, marginBottom: 24 },
  nextButtonText: { color: colors.text.inverse, fontSize: 16, fontWeight: '600', marginRight: 8 },
  historyContainer: { marginTop: 24, padding: 16, backgroundColor: colors.background.secondary, borderRadius: 12 },
  historyTitle: { fontSize: 14, fontWeight: '600', color: colors.text.secondary, marginBottom: 12 },
  historyTurn: { padding: 12, borderRadius: 8, marginBottom: 8 },
  historyUserTurn: { backgroundColor: colors.primary[50] },
  historyAiTurn: { backgroundColor: colors.primary[100] },
  historyTurnSpeaker: { fontSize: 12, fontWeight: '600', color: colors.text.secondary, marginBottom: 4 },
  historyTurnText: { fontSize: 14, color: colors.text.primary },
  historySecondaryInstructionText: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  permissionText: { fontSize: 16, color: colors.text.secondary, textAlign: 'center', marginTop: 16, marginBottom: 24 },
  permissionButton: { backgroundColor: colors.primary[500], padding: 16, borderRadius: 8, paddingHorizontal: 32 },
  permissionButtonText: { color: colors.text.inverse, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  completeText: { fontSize: 24, fontWeight: '700', color: colors.text.primary, marginTop: 16, textAlign: 'center' },
  completeSubtext: { fontSize: 16, color: colors.text.secondary, marginTop: 8, textAlign: 'center' },
  loader: { marginTop: 24 },
});
