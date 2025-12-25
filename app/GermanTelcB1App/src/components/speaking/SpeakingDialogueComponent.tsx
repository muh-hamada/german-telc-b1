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
} from 'react-native';
import { Recorder } from '@react-native-community/audio-toolkit';
import Sound from 'react-native-sound';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { SpeakingDialogueTurn, SpeakingEvaluation } from '../../types/prep-plan.types';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface SpeakingDialogueComponentProps {
  dialogue: SpeakingDialogueTurn[];
  onComplete: (evaluation: SpeakingEvaluation) => void;
  onTurnComplete: (turnIndex: number, audioUrl: string, transcription: string) => void;
  level: 'A1' | 'B1' | 'B2';
}

export const SpeakingDialogueComponent: React.FC<SpeakingDialogueComponentProps> = ({
  dialogue,
  onComplete,
  onTurnComplete,
  level,
}) => {
  const { t } = useCustomTranslation();
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [userResponses, setUserResponses] = useState<Array<{
    turnIndex: number;
    audioUrl: string;
    transcription: string;
  }>>([]);

  const recorderRef = useRef<Recorder | null>(null);
  const soundRef = useRef<Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentTurn = dialogue[currentTurnIndex];
  const isUserTurn = currentTurn?.speaker === 'user';
  const isDialogueComplete = currentTurnIndex >= dialogue.length;

  // Request microphone permission
  useEffect(() => {
    requestMicrophonePermission();
    return () => {
      // Cleanup
      if (recorderRef.current) {
        recorderRef.current.destroy();
      }
      if (soundRef.current) {
        soundRef.current.release();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: t('speaking.permissions.title'),
            message: t('speaking.permissions.message'),
            buttonNeutral: t('speaking.permissions.askLater'),
            buttonNegative: t('speaking.permissions.cancel'),
            buttonPositive: t('speaking.permissions.ok'),
          }
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.warn(err);
        setHasPermission(false);
      }
    } else {
      // iOS permissions handled automatically
      setHasPermission(true);
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      Alert.alert(
        t('speaking.permissions.denied'),
        t('speaking.permissions.deniedMessage')
      );
      return;
    }

    try {
      const filename = `speaking_${Date.now()}.m4a`;
      
      recorderRef.current = new Recorder(filename, {
        bitrate: 256000,
        channels: 2,
        sampleRate: 44100,
        quality: 'high',
      });

      recorderRef.current.prepare((err) => {
        if (err) {
          console.error('Recorder prepare error:', err);
          Alert.alert(t('speaking.error'), t('speaking.recordingError'));
          return;
        }

        recorderRef.current?.record((error) => {
          if (error) {
            console.error('Recording error:', error);
            Alert.alert(t('speaking.error'), t('speaking.recordingError'));
          }
        });
      });

      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Start recording error:', error);
      Alert.alert(t('speaking.error'), t('speaking.recordingError'));
    }
  };

  const stopRecording = async () => {
    try {
      if (!recorderRef.current) return;

      recorderRef.current.stop((err) => {
        if (err) {
          console.error('Stop recording error:', err);
          Alert.alert(t('speaking.error'), t('speaking.recordingError'));
          return;
        }

        const audioPath = recorderRef.current?.fsPath || '';
        setIsRecording(false);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Process the recording
        processRecording(audioPath);
      });

    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert(t('speaking.error'), t('speaking.recordingError'));
    }
  };

  const processRecording = async (audioPath: string) => {
    setIsProcessing(true);

    try {
      // Call the onTurnComplete callback to upload and transcribe
      // The parent component will handle the API calls
      await onTurnComplete(currentTurnIndex, audioPath, '');

      // Store response
      setUserResponses(prev => [...prev, {
        turnIndex: currentTurnIndex,
        audioUrl: audioPath,
        transcription: '', // Will be filled by parent
      }]);

      // Move to next turn
      setTimeout(() => {
        setIsProcessing(false);
        setRecordingDuration(0);
        setCurrentTurnIndex(prev => prev + 1);
      }, 500);

    } catch (error) {
      console.error('Processing error:', error);
      Alert.alert(t('speaking.error'), t('speaking.processingError'));
      setIsProcessing(false);
    }
  };

  const playAIResponse = async () => {
    if (!currentTurn || !currentTurn.aiAudioUrl) return;

    setIsPlaying(true);

    try {
      Sound.setCategory('Playback');

      const sound = new Sound(currentTurn.aiAudioUrl, '', (error) => {
        if (error) {
          console.error('Sound loading error:', error);
          setIsPlaying(false);
          return;
        }

        sound.play((success) => {
          if (success) {
            console.log('AI response played successfully');
          } else {
            console.log('Playback failed');
          }
          setIsPlaying(false);
          sound.release();
        });
      });

      soundRef.current = sound;

    } catch (error) {
      console.error('Play audio error:', error);
      setIsPlaying(false);
    }
  };

  const handleNextAfterAI = () => {
    setCurrentTurnIndex(prev => prev + 1);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Icon name="mic-off" size={64} color="#ccc" />
        <Text style={styles.permissionText}>
          {t('speaking.permissions.required')}
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestMicrophonePermission}
        >
          <Text style={styles.permissionButtonText}>
            {t('speaking.permissions.grant')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isDialogueComplete) {
    return (
      <View style={styles.container}>
        <Icon name="check-circle" size={64} color="#4CAF50" />
        <Text style={styles.completeText}>
          {t('speaking.complete')}
        </Text>
        <Text style={styles.completeSubtext}>
          {t('speaking.evaluating')}
        </Text>
        <ActivityIndicator size="large" color="#667eea" style={styles.loader} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {t('speaking.turn')} {currentTurnIndex + 1} / {dialogue.length}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentTurnIndex + 1) / dialogue.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Current Turn Display */}
      <View style={styles.turnContainer}>
        <View style={[
          styles.turnCard,
          isUserTurn ? styles.userTurnCard : styles.aiTurnCard,
        ]}>
          <View style={styles.turnHeader}>
            <Icon
              name={isUserTurn ? "person" : "psychology"}
              size={24}
              color={isUserTurn ? "#667eea" : "#4facfe"}
            />
            <Text style={styles.turnSpeaker}>
              {isUserTurn ? t('speaking.you') : t('speaking.ai')}
            </Text>
          </View>

          <Text style={styles.turnText}>{currentTurn?.text}</Text>

          {!isUserTurn && currentTurn?.aiAudioUrl && (
            <TouchableOpacity
              style={[styles.playButton, isPlaying && styles.playButtonDisabled]}
              onPress={playAIResponse}
              disabled={isPlaying}
            >
              <Icon
                name={isPlaying ? "volume-up" : "play-arrow"}
                size={24}
                color="#fff"
              />
              <Text style={styles.playButtonText}>
                {isPlaying ? t('speaking.playing') : t('speaking.playAudio')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Recording Controls */}
      {isUserTurn && (
        <View style={styles.recordingControls}>
          {!isRecording && !isProcessing && (
            <TouchableOpacity
              style={styles.recordButton}
              onPress={startRecording}
            >
              <Icon name="mic" size={32} color="#fff" />
              <Text style={styles.recordButtonText}>
                {t('speaking.startRecording')}
              </Text>
            </TouchableOpacity>
          )}

          {isRecording && (
            <View style={styles.recordingActive}>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>
                  {t('speaking.recording')}
                </Text>
              </View>
              <Text style={styles.recordingTime}>
                {formatTime(recordingDuration)}
              </Text>
              <TouchableOpacity
                style={styles.stopButton}
                onPress={stopRecording}
              >
                <Icon name="stop" size={32} color="#fff" />
                <Text style={styles.stopButtonText}>
                  {t('speaking.stopRecording')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {isProcessing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.processingText}>
                {t('speaking.processing')}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Next Button for AI Turns */}
      {!isUserTurn && (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNextAfterAI}
        >
          <Text style={styles.nextButtonText}>
            {t('speaking.next')}
          </Text>
          <Icon name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Previous Turns (for context) */}
      {currentTurnIndex > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>{t('speaking.previousTurns')}</Text>
          {dialogue.slice(Math.max(0, currentTurnIndex - 3), currentTurnIndex).map((turn, index) => (
            <View
              key={index}
              style={[
                styles.historyTurn,
                turn.speaker === 'user' ? styles.historyUserTurn : styles.historyAiTurn,
              ]}
            >
              <Text style={styles.historyTurnSpeaker}>
                {turn.speaker === 'user' ? t('speaking.you') : t('speaking.ai')}:
              </Text>
              <Text style={styles.historyTurnText}>{turn.text}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
  turnContainer: {
    marginBottom: 24,
  },
  turnCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userTurnCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  aiTurnCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#4facfe',
  },
  turnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  turnSpeaker: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  turnText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4facfe',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  playButtonDisabled: {
    opacity: 0.6,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  recordingControls: {
    marginBottom: 24,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  recordingActive: {
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e74c3c',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '600',
  },
  recordingTime: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    padding: 20,
    borderRadius: 12,
    width: '100%',
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  processingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  processingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  historyContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  historyTurn: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyUserTurn: {
    backgroundColor: '#f0f0ff',
  },
  historyAiTurn: {
    backgroundColor: '#f0f8ff',
  },
  historyTurnSpeaker: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  historyTurnText: {
    fontSize: 14,
    color: '#333',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 8,
    paddingHorizontal: 32,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  completeSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  loader: {
    marginTop: 24,
  },
});

