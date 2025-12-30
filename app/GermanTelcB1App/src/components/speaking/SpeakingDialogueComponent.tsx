import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
  PermissionsAndroid,
  ScrollView,
  Linking,
} from 'react-native';
import Sound from 'react-native-nitro-sound';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { SpeakingDialogueTurn, SpeakingEvaluation } from '../../types/prep-plan.types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ExamLevel } from '../../config/exam-config.types';
import { getActiveExamConfig } from '../../config/active-exam.config';

interface SpeakingDialogueComponentProps {
  dialogue: SpeakingDialogueTurn[];
  currentTurnIndex: number;
  onComplete: (evaluation: SpeakingEvaluation) => void;
  onTurnComplete: (turnIndex: number, audioUrl: string, transcription: string) => void;
  onNextTurn: () => void;
  level: ExamLevel;
}

export const SpeakingDialogueComponent: React.FC<SpeakingDialogueComponentProps> = ({
  dialogue,
  currentTurnIndex,
  onComplete,
  onTurnComplete,
  onNextTurn,
  level,
}) => {
  const { t, i18n } = useCustomTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const soundPlayerRef = useRef<typeof Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentTurn = dialogue[currentTurnIndex];
  const isUserTurn = currentTurn?.speaker === 'user';
  const isDialogueComplete = currentTurnIndex >= dialogue.length;

  const activeExamConfig = getActiveExamConfig();
  const examLangMap: Record<string, 'de' | 'en' | 'fr' | 'es'> = {
    'german': 'de',
    'english': 'en',
    'french': 'fr',
    'spanish': 'es'
  };
  const examLangCode = examLangMap[activeExamConfig.language] || 'de';
  const interfaceLangCode = (i18n.language || 'de').split('-')[0] as 'de' | 'ar' | 'en' | 'ru' | 'es' | 'fr';

  const examInstruction = isUserTurn && currentTurn.instruction 
    ? (currentTurn.instruction[examLangCode] || currentTurn.instruction.de || currentTurn.instruction.en)
    : '';
    
  const interfaceInstruction = isUserTurn && currentTurn.instruction && examLangCode !== interfaceLangCode
    ? (currentTurn.instruction[interfaceLangCode] || currentTurn.instruction.en || currentTurn.instruction.de)
    : '';

  useEffect(() => {
    requestMicrophonePermission();
    return () => {
      if (soundPlayerRef.current) {
        Sound.stopPlayer();
      }
      Sound.stopRecorder().catch(() => {});
      Sound.removeRecordBackListener();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentTurnIndex >= dialogue.length) {
      const mockEvaluation: SpeakingEvaluation = {
        transcription: '',
        scores: {
          pronunciation: 0,
          fluency: 0,
          grammarAccuracy: 0,
          vocabularyRange: 0,
          contentRelevance: 0,
        },
        totalScore: 0,
        feedback: '',
        strengths: [],
        areasToImprove: [],
      };
      onComplete(mockEvaluation);
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
      console.log('[SpeakingDialogue] Starting recording...');
      await Sound.stopPlayer();
      const audioPath = await Sound.startRecorder();
      console.log('[SpeakingDialogue] Recording started, path:', audioPath);
      
      Sound.addRecordBackListener((e: any) => {
        const seconds = Math.floor(e.currentPosition / 1000);
        setRecordingDuration(seconds);
      });

      setIsRecording(true);
    } catch (error) {
      console.error('Start recording error:', error);
      Alert.alert(t('speaking.error'), t('speaking.recordingError'));
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      console.log(`[SpeakingDialogue] Stopping recording... Duration: ${recordingDuration}s`);
      const audioPath = await Sound.stopRecorder();
      Sound.removeRecordBackListener();
      
      setIsRecording(false);
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
    }
  };

  const processRecording = async (audioPath: string) => {
    setIsProcessing(true);
    setUploadProgress(0);
    try {
      await onTurnComplete(currentTurnIndex, audioPath, '');
      setIsProcessing(false);
      setUploadProgress(0);
      setRecordingDuration(0);
    } catch (error: any) {
      console.error('Processing error:', error);
      let errorMessage = t('speaking.processingError');
      if (error.message?.includes('timeout')) errorMessage = t('speaking.uploadTimeout');
      else if (error.message?.includes('network')) errorMessage = t('speaking.networkError');
      Alert.alert(t('speaking.error'), errorMessage);
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  useEffect(() => {
    // Automatically play AI audio when turn changes to AI
    if (!isUserTurn && currentTurn && (currentTurn.audioUrl || currentTurn.audio_url)) {
      playAIResponse();
    }
  }, [currentTurnIndex]);

  const playAIResponse = async () => {
    const url = currentTurn?.audioUrl || currentTurn?.audio_url;
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

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Icon name="mic-off" size={64} color="#ccc" />
        <Text style={styles.permissionText}>{t('speaking.permissions.required')}</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestMicrophonePermission}>
          <Text style={styles.permissionButtonText}>{t('speaking.permissions.grant')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isDialogueComplete) {
    return (
      <View style={styles.container}>
        <Icon name="check-circle" size={64} color="#4CAF50" />
        <Text style={styles.completeText}>{t('speaking.complete')}</Text>
        <Text style={styles.completeSubtext}>{t('speaking.evaluating')}</Text>
        <ActivityIndicator size="large" color="#667eea" style={styles.loader} />
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
              <Icon name={isUserTurn ? "person" : "psychology"} size={24} color={isUserTurn ? "#667eea" : "#4facfe"} />
              <Text style={styles.turnSpeaker}>{isUserTurn ? t('speaking.you') : t('speaking.ai')}</Text>
            </View>
            {!isUserTurn && (currentTurn?.audioUrl || currentTurn?.audio_url) && (
              <TouchableOpacity 
                style={[styles.replayIconButton, isPlaying && styles.replayIconButtonActive]} 
                onPress={playAIResponse}
              >
                <Icon name={isPlaying ? "volume-up" : "play-arrow"} size={20} color={isPlaying ? "#4facfe" : "#666"} />
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
              <Icon name={isPlaying ? "volume-up" : "play-arrow"} size={24} color="#fff" />
              <Text style={styles.playButtonText}>{isPlaying ? t('speaking.playing') : t('speaking.playAudio')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isUserTurn && (
        <View style={styles.recordingControls}>
          {!isRecording && !isProcessing && (
            <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
              <Icon name="mic" size={32} color="#fff" />
              <Text style={styles.recordButtonText}>{t('speaking.startRecording')}</Text>
            </TouchableOpacity>
          )}
          {isRecording && (
            <View style={styles.recordingActive}>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>{t('speaking.recording')}</Text>
              </View>
              <Text style={styles.recordingTime}>{formatTime(recordingDuration)}</Text>
              <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                <Icon name="stop" size={32} color="#fff" />
                <Text style={styles.stopButtonText}>{t('speaking.stopRecording')}</Text>
              </TouchableOpacity>
            </View>
          )}
          {isProcessing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.processingText}>{t('speaking.processing')}</Text>
            </View>
          )}
        </View>
      )}

      {!isUserTurn && (
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>{t('speaking.next')}</Text>
          <Icon name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {currentTurnIndex > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>{t('speaking.previousTurns')}</Text>
          {dialogue.slice(Math.max(0, currentTurnIndex - 3), currentTurnIndex).map((turn, index) => {
            const isTurnUser = turn.speaker === 'user';
            const turnExamInstruction = isTurnUser && turn.instruction 
              ? (turn.instruction[examLangCode] || turn.instruction.de || turn.instruction.en)
              : '';
            const turnInterfaceInstruction = isTurnUser && turn.instruction && examLangCode !== interfaceLangCode
              ? (turn.instruction[interfaceLangCode] || turn.instruction.en || turn.instruction.de)
              : '';
              
            return (
              <View key={index} style={[styles.historyTurn, isTurnUser ? styles.historyUserTurn : styles.historyAiTurn]}>
                <Text style={styles.historyTurnSpeaker}>{isTurnUser ? t('speaking.you') : t('speaking.ai')}:</Text>
                <View>
                  <Text style={styles.historyTurnText}>
                    {isTurnUser 
                      ? (turn.transcription || `(${turnExamInstruction})`) 
                      : turn.text}
                  </Text>
                  {isTurnUser && !turn.transcription && !!turnInterfaceInstruction && (
                    <Text style={styles.historySecondaryInstructionText}>
                      ({turnInterfaceInstruction})
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  contentContainer: { padding: 16 },
  progressContainer: { marginBottom: 20 },
  progressText: { fontSize: 14, color: '#666', marginBottom: 8, textAlign: 'center' },
  progressBar: { height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#667eea', borderRadius: 2 },
  turnContainer: { marginBottom: 24 },
  turnCard: { padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  userTurnCard: { backgroundColor: '#fff', borderLeftWidth: 4, borderLeftColor: '#667eea' },
  aiTurnCard: { backgroundColor: '#fff', borderLeftWidth: 4, borderLeftColor: '#4facfe' },
  turnHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  speakerInfo: { flexDirection: 'row', alignItems: 'center' },
  turnSpeaker: { fontSize: 16, fontWeight: '600', marginLeft: 8, color: '#333' },
  replayIconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  replayIconButtonActive: {
    backgroundColor: '#e3f2fd',
  },
  turnText: { fontSize: 16, color: '#333', lineHeight: 24 },
  secondaryInstructionText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  playButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4facfe', padding: 12, borderRadius: 8, marginTop: 12 },
  playButtonDisabled: { opacity: 0.6 },
  playButtonText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  recordingControls: { marginBottom: 24 },
  recordButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e74c3c', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  recordButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 12 },
  recordingActive: { alignItems: 'center' },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  recordingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e74c3c', marginRight: 8 },
  recordingText: { fontSize: 16, color: '#e74c3c', fontWeight: '600' },
  recordingTime: { fontSize: 32, fontWeight: '700', color: '#333', marginBottom: 16 },
  stopButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e74c3c', padding: 20, borderRadius: 12, width: '100%' },
  stopButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 12 },
  processingContainer: { alignItems: 'center', padding: 24 },
  processingText: { fontSize: 14, color: '#666', marginTop: 12 },
  nextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#667eea', padding: 16, borderRadius: 12, marginBottom: 24 },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginRight: 8 },
  historyContainer: { marginTop: 24, padding: 16, backgroundColor: '#fff', borderRadius: 12 },
  historyTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 12 },
  historyTurn: { padding: 12, borderRadius: 8, marginBottom: 8 },
  historyUserTurn: { backgroundColor: '#f0f0ff' },
  historyAiTurn: { backgroundColor: '#f0f8ff' },
  historyTurnSpeaker: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 4 },
  historyTurnText: { fontSize: 14, color: '#333' },
  historySecondaryInstructionText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    fontStyle: 'italic',
  },
  permissionText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 16, marginBottom: 24 },
  permissionButton: { backgroundColor: '#667eea', padding: 16, borderRadius: 8, paddingHorizontal: 32 },
  permissionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  completeText: { fontSize: 24, fontWeight: '700', color: '#333', marginTop: 16, textAlign: 'center' },
  completeSubtext: { fontSize: 16, color: '#666', marginTop: 8, textAlign: 'center' },
  loader: { marginTop: 24 },
});
