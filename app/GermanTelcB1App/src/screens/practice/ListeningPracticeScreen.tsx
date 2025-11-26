import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, ActivityIndicator, Alert, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../../theme';
import Sound from 'react-native-sound';
import { HomeStackParamList } from '../../types/navigation.types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ListeningPracticeInterview } from '../../types/exam.types';
import LinearGradient from 'react-native-linear-gradient';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { useProgress } from '../../contexts/ProgressContext';

type ScreenRouteProp = RouteProp<HomeStackParamList, 'ListeningPractice'>;

const ListeningPracticeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ScreenRouteProp>();
  const { interview, id } = route.params;
  const { t } = useCustomTranslation();
  const { updateExamProgress, userProgress } = useProgress();

  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Sound | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const isCompleted = userProgress?.exams?.some(e => e.examType === 'listening-practice' && e.examId === id && e.completed);

  useEffect(() => {
    Sound.setCategory('Playback');

    if (!interview.audio_url) {
      Alert.alert('Error', 'Audio URL is missing');
      return;
    }

    const newSound = new Sound(interview.audio_url, '', (error) => {
      if (error) {
        console.log('failed to load the sound', error);
        Alert.alert('Error', 'Failed to load audio file');
        return;
      }
      setIsLoaded(true);
      setDuration(newSound.getDuration());
    });

    setSound(newSound);

    return () => {
      if (newSound) {
        newSound.release();
      }
    };
  }, [interview.audio_url]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && sound) {
      interval = setInterval(() => {
        sound.getCurrentTime((seconds) => {
          setCurrentTime(seconds);
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, sound]);

  const togglePlayback = () => {
    if (!sound) return;

    if (isPlaying) {
      sound.pause();
      setIsPlaying(false);
      logEvent(AnalyticsEvents.LISTENING_PRACTICE_PAUSED, {
          title: interview.title,
          id: id,
          current_time: currentTime
      });
    } else {
      sound.play((success) => {
        if (success) {
          setIsPlaying(false);
          setCurrentTime(0);
          logEvent(AnalyticsEvents.LISTENING_PRACTICE_COMPLETED, {
              title: interview.title,
              id: id,
              duration: duration
          });
        } else {
          console.log('playback failed due to audio decoding errors');
        }
      });
      setIsPlaying(true);
      logEvent(AnalyticsEvents.LISTENING_PRACTICE_RESUMED, {
          title: interview.title,
          id: id,
          current_time: currentTime
      });
    }
  };

  const skipBackward = () => {
    if (!sound) return;
    const newTime = Math.max(0, currentTime - 10);
    sound.setCurrentTime(newTime);
    setCurrentTime(newTime);
  };

  const skipForward = () => {
    if (!sound) return;
    const newTime = Math.min(duration, currentTime + 10);
    sound.setCurrentTime(newTime);
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleAssess = () => {
    if (sound) {
      sound.pause();
      setIsPlaying(false);
    }
    logEvent(AnalyticsEvents.LISTENING_PRACTICE_ASSESSMENT_STARTED, {
        title: interview.title,
        id: id
    });
    navigation.navigate('ListeningPracticeQuestions', { interview, id });
  };

  const handleMarkCompleted = () => {
      // Toggle completion status
      const newStatus = !isCompleted;
      updateExamProgress('listening-practice', id, [], 0, 0, newStatus);
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, { 
          section: 'listening_practice', 
          exam_id: id, 
          completed: newStatus,
          title: interview.title 
      });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: interview.image_url }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,1)']}
          style={styles.overlay}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Icon name={I18nManager.isRTL ? "arrow-right" : "arrow-left"} size={24} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleMarkCompleted} style={styles.actionButton}>
                <Icon name={isCompleted ? "check-circle" : "check-circle-outline"} size={28} color={isCompleted ? colors.success[500] : colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.contentContainer}>
              <Text style={styles.title}>{interview.title}</Text>

              <View style={styles.bottomContainer}>
                {/* Audio Controls */}
                <View style={styles.playerContainer}>

                  <View style={styles.progressContainer}>
                    <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }]} />
                    </View>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                  </View>

                  <View style={styles.controlsRow}>
                    <TouchableOpacity onPress={skipBackward} disabled={!isLoaded} style={styles.controlButton}>
                      <Icon name={I18nManager.isRTL ? "fast-forward-10" : "rewind-10"} size={36} color={colors.white} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={togglePlayback} disabled={!isLoaded} style={styles.playButton}>
                      {isLoaded ? (
                        <Icon name={isPlaying ? "pause" : "play"} size={40} color={colors.white} />
                      ) : (
                        <ActivityIndicator color={colors.white} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={skipForward} disabled={!isLoaded} style={styles.controlButton}>
                      <Icon name={I18nManager.isRTL ? "rewind-10" : "fast-forward-10"} size={36} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Assess Button */}
                <TouchableOpacity style={styles.assessButton} onPress={handleAssess}>
                  <Text style={styles.assessButtonText}>{t('practice.listening.practice.assessUnderstanding')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: spacing.padding.lg,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    ...typography.textStyles.h2,
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    direction: 'ltr',
    marginBottom: spacing.margin.xl,
  },
  bottomContainer: {
    width: '100%',
  },
  playerContainer: {
    marginBottom: spacing.margin.xl,
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.margin.lg,
    gap: spacing.margin.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
  },
  timeText: {
    ...typography.textStyles.bodySmall,
    color: colors.white,
    width: 40,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.margin.xl,
  },
  controlButton: {
    padding: spacing.padding.sm,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    ...(I18nManager.isRTL && { transform: [{ scaleX: -1 }] }),
  },
  assessButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  assessButtonText: {
    ...typography.textStyles.h4,
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default ListeningPracticeScreen;
