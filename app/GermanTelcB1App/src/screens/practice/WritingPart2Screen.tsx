import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
  Platform,
  PermissionsAndroid,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { launchCamera } from 'react-native-image-picker';
import { spacing, typography, type ThemeColors } from '../../theme';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useExamCompletion } from '../../contexts/CompletionContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { useModalQueue } from '../../contexts/ModalQueueContext';
import { usePremium } from '../../contexts/PremiumContext';
import { HomeStackRouteProp } from '../../types/navigation.types';
import { dataService } from '../../services/data.service';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { useProgress } from '../../contexts/ProgressContext';
import { UserAnswer } from '../../types/exam.types';
import {
  evaluateWritingA1,
  evaluateWritingWithImageA1,
  WritingAssessmentA1,
} from '../../services/http.openai.service';
import { RewardedAd, RewardedAdEventType, TestIds, AdEventType } from 'react-native-google-mobile-ads';
import { SKIP_REWARDED_ADS } from '../../config/development.config';
import { activeExamConfig } from '../../config/active-exam.config';
import MarkdownText from '../../components/MarkdownText';

// Ad Unit ID for rewarded ad
const REWARDED_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.select({
    ios: activeExamConfig.ads.rewarded.ios,
    android: activeExamConfig.ads.rewarded.android,
  }) || TestIds.REWARDED;

const WritingPart2Screen: React.FC = () => {
  const { t } = useCustomTranslation();
  const route = useRoute<HomeStackRouteProp<'WritingPart2'>>();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const examId = route.params?.examId ?? 0;
  const { updateExamProgress } = useProgress();
  const { setContextualModalActive } = useModalQueue();
  const { isPremium } = usePremium();

  const { isCompleted, toggleCompletion } = useExamCompletion('writing', 2, examId);

  const [currentExam, setCurrentExam] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userText, setUserText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [assessment, setAssessment] = useState<WritingAssessmentA1 | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [lastEvaluatedAnswer, setLastEvaluatedAnswer] = useState('');
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [isImagePreviewModalOpen, setIsImagePreviewModalOpen] = useState(false);
  const [isUsingCachedResult, setIsUsingCachedResult] = useState(false);
  const [showRewardedAdModal, setShowRewardedAdModal] = useState(false);
  const [rewardedAd, setRewardedAd] = useState<RewardedAd | null>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [pendingEvaluationType, setPendingEvaluationType] = useState<'text' | 'image' | null>(null);
  const pendingEvaluationTypeRef = useRef<'text' | 'image' | null>(null);
  const capturedImageUriRef = useRef<string | null>(null);
  const capturedImageBase64Ref = useRef<string | null>(null);
  const adEarnedRewardRef = useRef<boolean>(false);
  const userTextRef = useRef<string>('');
  const currentExamRef = useRef<any | null>(null);

  // Initialize and load rewarded ad
  useEffect(() => {
    const ad = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });

    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('[WritingPart2Screen] ✅ Rewarded ad loaded successfully');
      setIsAdLoaded(true);
    });

    const unsubscribeEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        console.log('[WritingPart2Screen] 🎁 User earned reward:', reward);
        adEarnedRewardRef.current = true;
        logEvent(AnalyticsEvents.REWARDED_AD_EARNED_REWARD, { ad_unit_id: REWARDED_AD_UNIT_ID });
        console.log('[WritingPart2Screen] 💾 Reward earned, waiting for ad to close before starting evaluation');
      }
    );

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('[WritingPart2Screen] ❌ Rewarded ad closed', {
        earnedReward: adEarnedRewardRef.current,
        pendingEvaluationType: pendingEvaluationTypeRef.current
      });
      logEvent(AnalyticsEvents.REWARDED_AD_CLOSED, { ad_unit_id: REWARDED_AD_UNIT_ID });

      if (!adEarnedRewardRef.current) {
        console.log('[WritingPart2Screen] ⚠️ Ad closed without earning reward - resetting state');
        setPendingEvaluationType(null);
        pendingEvaluationTypeRef.current = null;
        setShowRewardedAdModal(false);
        setIsEvaluating(false);
      } else {
        console.log('[WritingPart2Screen] ✅ Ad closed after earning reward - starting evaluation NOW');
        setShowRewardedAdModal(false);

        const evaluationType = pendingEvaluationTypeRef.current;
        console.log('[WritingPart2Screen] 📝 Starting evaluation type:', evaluationType);
        if (evaluationType === 'text') {
          proceedWithTextEvaluation();
        } else if (evaluationType === 'image') {
          proceedWithImageEvaluation();
        }
      }

      const hadEarnedReward = adEarnedRewardRef.current;
      adEarnedRewardRef.current = false;

      setIsAdLoaded(false);
      console.log('[WritingPart2Screen] 🔄 Reloading ad for next time');
      ad.load();

      if (!hadEarnedReward) {
        setTimeout(() => {
          setPendingEvaluationType(null);
          pendingEvaluationTypeRef.current = null;
        }, 100);
      }
    });

    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, error => {
      console.error('💥 Rewarded ad error:', error);
      logEvent(AnalyticsEvents.REWARDED_AD_ERROR, { ad_unit_id: REWARDED_AD_UNIT_ID, error_code: String((error as any)?.code || 'unknown') });

      console.log('[WritingPart2Screen] 🧹 Error cleanup - resetting all states');
      setIsAdLoaded(false);
      setShowRewardedAdModal(false);
      setIsEvaluating(false);
      setPendingEvaluationType(null);
      pendingEvaluationTypeRef.current = null;
      adEarnedRewardRef.current = false;

      setTimeout(() => {
        console.log('[WritingPart2Screen] 🔄 Retrying ad load after error');
        ad.load();
      }, 5000);
    });

    console.log('[WritingPart2Screen] 📱 Initializing rewarded ad');
    ad.load();
    setRewardedAd(ad);

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, []);

  // Reload ad when pending evaluation type changes
  useEffect(() => {
    if (pendingEvaluationType && !isAdLoaded && rewardedAd) {
      rewardedAd.load();
    }
  }, [pendingEvaluationType, isAdLoaded, rewardedAd]);

  // Pause global modal queue when any writing modal is open
  useEffect(() => {
    const isAnyModalOpen = showResultsModal || isImagePreviewModalOpen || showRewardedAdModal || isEvaluating;
    setContextualModalActive(isAnyModalOpen);
  }, [showResultsModal, isImagePreviewModalOpen, showRewardedAdModal, isEvaluating, setContextualModalActive]);

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      setIsLoading(true);
      const exam = await dataService.getWritingPart2Exam(examId);
      setCurrentExam(exam || null);
      currentExamRef.current = exam || null; // Store in ref to persist across re-renders
    } catch (error) {
      console.error('Error loading exam:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
            color={colors.white}
          />
        </TouchableOpacity>
      ),
    });
  }, [isCompleted, navigation]);

  const handleToggleCompletion = async () => {
    try {
      const score = assessment?.overallScore || 0;
      const newStatus = await toggleCompletion(score);
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, {
        section: 'writing',
        part: 2,
        exam_id: examId,
        completed: newStatus,
        score,
      });
    } catch (error: any) {
      if (error.message === 'auth/not-logged-in') {
        Alert.alert(t('common.error'), t('exam.loginToSaveProgress'));
      } else {
        Alert.alert(t('common.error'), t('exam.completionFailed'));
      }
    }
  };

  const handleTextChange = (text: string) => {
    setUserText(text);
    userTextRef.current = text;
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: t('writing.alerts.cameraPermissionTitle'),
            message: t('writing.alerts.cameraPermissionMessage'),
            buttonNeutral: t('writing.alerts.askLater'),
            buttonNegative: t('common.cancel'),
            buttonPositive: t('writing.alerts.ok'),
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleTakePhoto = async () => {
    if (!launchCamera) {
      Alert.alert(
        t('writing.alerts.cameraNotAvailable'),
        t('writing.alerts.cameraNotAvailableMessage'),
        [{ text: t('writing.alerts.ok') }]
      );
      return;
    }

    const hasPermission = await requestCameraPermission();

    if (!hasPermission) {
      Alert.alert(
        t('writing.alerts.permissionDenied'),
        t('writing.alerts.permissionDeniedMessage'),
        [{ text: t('writing.alerts.ok') }]
      );
      return;
    }

    const options = {
      mediaType: 'photo' as const,
      quality: 0.8 as const,
      saveToPhotos: false,
      includeBase64: true,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('[WritingPart2Screen] User cancelled camera');
      } else if (response.errorCode) {
        Alert.alert(t('writing.alerts.cameraError'), t('writing.alerts.cameraErrorMessage'));
        console.error('[WritingPart2Screen] Camera error:', response);
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const imageUri = asset.uri;
        const imageBase64 = asset.base64;

        if (imageUri && imageBase64) {
          setCapturedImageUri(imageUri);
          setCapturedImageBase64(imageBase64);
          capturedImageUriRef.current = imageUri;
          capturedImageBase64Ref.current = imageBase64;
          setIsImagePreviewModalOpen(true);
        } else if (imageUri) {
          setCapturedImageUri(imageUri);
          setCapturedImageBase64(null);
          capturedImageUriRef.current = imageUri;
          capturedImageBase64Ref.current = null;
          setIsImagePreviewModalOpen(true);
        } else {
          Alert.alert(t('writing.alerts.cameraError'), t('writing.alerts.imageLoadError'));
        }
      }
    });
  };

  const handleEvaluateImage = async () => {
    if (!capturedImageUri) {
      Alert.alert(t('writing.alerts.cameraError'), t('writing.alerts.imageNotAvailable'));
      return;
    }

    const imageIdentifier = `[IMAGE:${capturedImageUri}]`;

    if (imageIdentifier === lastEvaluatedAnswer && assessment) {
      console.log('[WritingPart2Screen] Image unchanged, showing cached assessment directly');
      setIsImagePreviewModalOpen(false);
      setIsUsingCachedResult(true);
      setShowResultsModal(true);
      return;
    }

    setIsImagePreviewModalOpen(false);
    setPendingEvaluationType('image');
    pendingEvaluationTypeRef.current = 'image';

    if (SKIP_REWARDED_ADS || isPremium) {
      await proceedWithImageEvaluation();
    } else {
      logEvent(AnalyticsEvents.REWARDED_AD_PROMPT_SHOWN, { reason: 'writing_evaluation' });
      setShowRewardedAdModal(true);
    }
  };

  const proceedWithImageEvaluation = async () => {
    const exam = currentExamRef.current;
    if (!exam) {
      console.error('[WritingPart2Screen] No exam data available for evaluation');
      return;
    }

    setIsEvaluating(true);
    setIsUsingCachedResult(false);

    try {
      const imageBase64 = capturedImageBase64Ref.current;
      const imageUri = capturedImageUriRef.current;

      let result: WritingAssessmentA1;

      if (imageBase64) {
        result = await evaluateWritingWithImageA1({
          imageBase64: imageBase64,
          examTitle: exam.title,
          instructionHeader: exam.instruction_header,
          taskPoints: exam.task_points,
        });
      } else if (imageUri) {
        result = await evaluateWritingWithImageA1({
          imageUri: imageUri,
          examTitle: exam.title,
          instructionHeader: exam.instruction_header,
          taskPoints: exam.task_points,
        });
      } else {
        throw new Error('No image available');
      }

      setLastEvaluatedAnswer(`[IMAGE:${imageUri}]`);
      setAssessment(result);
      setShowResultsModal(true);
      logEvent(AnalyticsEvents.WRITING_EVAL_COMPLETED, { overall_score: result.overallScore, max_score: result.maxScore });

      // Update progress
      const answers: UserAnswer[] = result.contentPoints.map((point, index) => ({
        questionId: index + 1,
        answer: point.score > 0 ? 'addressed' : 'not_addressed',
        userAnswer: point.score > 0 ? 'addressed' : 'not_addressed',
        isCorrect: point.score === 3,
        timestamp: Date.now(),
      } as UserAnswer));
      updateExamProgress('writing-part2', examId, answers, result.overallScore, result.maxScore);
    } catch (error) {
      console.error('Evaluation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      logEvent(AnalyticsEvents.WRITING_EVAL_FAILED, {
        error_message: errorMessage,
        evaluation_type: 'image'
      });

      Alert.alert(
        t('writing.alerts.evaluationError'),
        error instanceof Error ? error.message : t('writing.alerts.evaluationErrorMessage'),
        [{ text: t('writing.alerts.ok'), style: 'default' }]
      );
    } finally {
      setIsEvaluating(false);
      setPendingEvaluationType(null);
      pendingEvaluationTypeRef.current = null;
    }
  };

  const handleEvaluate = async () => {
    if (userText.trim().length < 50) {
      Alert.alert(
        t('exam.incomplete'),
        t('practice.writing.minCharactersRequired', { count: 50 }),
        [{ text: 'OK' }]
      );
      return;
    }

    if (userText === lastEvaluatedAnswer && assessment) {
      console.log('[WritingPart2Screen] Answer unchanged, showing cached assessment directly');
      setIsUsingCachedResult(true);
      setShowResultsModal(true);
      return;
    }

    userTextRef.current = userText;

    setPendingEvaluationType('text');
    pendingEvaluationTypeRef.current = 'text';

    if (SKIP_REWARDED_ADS || isPremium) {
      await proceedWithTextEvaluation();
    } else {
      logEvent(AnalyticsEvents.REWARDED_AD_PROMPT_SHOWN, { reason: 'writing_evaluation' });
      setShowRewardedAdModal(true);
    }
  };

  const proceedWithTextEvaluation = async () => {
    console.log('[WritingPart2Screen] proceedWithTextEvaluation called');
    const exam = currentExamRef.current;
    if (!exam) {
      console.error('[WritingPart2Screen] No exam data available for evaluation');
      return;
    }
    console.log('[WritingPart2Screen] proceedWithTextEvaluation called 2', exam);

    setIsEvaluating(true);
    setIsUsingCachedResult(false);

    try {
      const answerToEvaluate = userTextRef.current;
      console.log('[WritingPart2Screen] Evaluating text:', answerToEvaluate.substring(0, 50) + '...');

      const result = await evaluateWritingA1({
        userAnswer: answerToEvaluate,
        examTitle: exam.title,
        instructionHeader: exam.instruction_header,
        taskPoints: exam.task_points,
      });

      setLastEvaluatedAnswer(answerToEvaluate);
      setAssessment(result);
      setShowResultsModal(true);
      logEvent(AnalyticsEvents.WRITING_EVAL_COMPLETED, { overall_score: result.overallScore, max_score: result.maxScore });

      // Update progress
      const answers: UserAnswer[] = result.contentPoints.map((point, index) => ({
        questionId: index + 1,
        answer: point.score > 0 ? 'addressed' : 'not_addressed',
        userAnswer: point.score > 0 ? 'addressed' : 'not_addressed',
        isCorrect: point.score === 3,
        timestamp: Date.now(),
      } as UserAnswer));
      updateExamProgress('writing-part2', examId, answers, result.overallScore, result.maxScore);
    } catch (error) {
      console.error('Evaluation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      logEvent(AnalyticsEvents.WRITING_EVAL_FAILED, {
        error_message: errorMessage,
        evaluation_type: 'text'
      });

      Alert.alert(
        t('writing.alerts.evaluationError'),
        error instanceof Error ? error.message : t('writing.alerts.evaluationErrorMessage'),
        [{ text: t('writing.alerts.ok'), style: 'default' }]
      );
    } finally {
      setIsEvaluating(false);
      setPendingEvaluationType(null);
      pendingEvaluationTypeRef.current = null;
    }
  };

  const handleWatchAdAndEvaluate = () => {
    console.log('[WritingPart2Screen] handleWatchAdAndEvaluate called', {
      hasAd: !!rewardedAd,
      isAdLoaded,
      pendingEvaluationType
    });

    if (!rewardedAd || !isAdLoaded) {
      console.log('[WritingPart2Screen] Ad not ready, showing alert');
      Alert.alert(
        t('writing.rewardedAdModal.adNotReady'),
        '',
        [{ text: t('writing.alerts.ok') }]
      );
      setShowRewardedAdModal(false);
      setPendingEvaluationType(null);
      pendingEvaluationTypeRef.current = null;
      return;
    }

    console.log('[WritingPart2Screen] Preparing to show rewarded ad...');
    logEvent(AnalyticsEvents.REWARDED_AD_OPENED, { ad_unit_id: REWARDED_AD_UNIT_ID });
    adEarnedRewardRef.current = false;

    setShowRewardedAdModal(false);

    setTimeout(() => {
      console.log('[WritingPart2Screen] Calling rewardedAd.show()');
      try {
        rewardedAd.show();
      } catch (showError) {
        console.error('[WritingPart2Screen] Error calling show():', showError);
        logEvent(AnalyticsEvents.REWARDED_AD_ERROR, { ad_unit_id: REWARDED_AD_UNIT_ID, error_code: 'show_failed' });

        setTimeout(() => {
          setShowRewardedAdModal(false);
          setIsEvaluating(false);
          setPendingEvaluationType(null);
          pendingEvaluationTypeRef.current = null;
          adEarnedRewardRef.current = false;
        }, 100);
      }
    }, 600);
  };

  const handleMaybeLater = () => {
    setShowRewardedAdModal(false);
    setPendingEvaluationType(null);
    pendingEvaluationTypeRef.current = null;
    logEvent(AnalyticsEvents.REWARDED_AD_SKIPPED, { reason: 'user_cancelled' });
  };

  const getWordCount = () => {
    return userText.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return colors.success[500];
    if (percentage >= 70) return colors.warning[500];
    return colors.error[500];
  };

  const renderRewardedAdModal = () => {
    return (
      <Modal
        visible={showRewardedAdModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleMaybeLater}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.rewardedAdModalContent]}>
            <Text style={styles.rewardedAdModalTitle}>
              {t('writing.rewardedAdModal.title')}
            </Text>

            <Text style={styles.rewardedAdModalMessage}>
              {t('writing.rewardedAdModal.message')}
            </Text>

            <View style={styles.rewardedAdModalButtons}>
              <TouchableOpacity
                style={[styles.rewardedAdModalButton, styles.watchAdButton]}
                onPress={handleWatchAdAndEvaluate}
                disabled={!isAdLoaded}
              >
                <Text style={styles.rewardedAdModalButtonText}>
                  {t('writing.rewardedAdModal.watchAdButton')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.rewardedAdModalButton, styles.maybeLaterButton]}
                onPress={handleMaybeLater}
              >
                <Text style={[styles.rewardedAdModalButtonText, styles.maybeLaterButtonText]}>
                  {t('writing.rewardedAdModal.maybeLaterButton')}
                </Text>
              </TouchableOpacity>
            </View>

            {!isAdLoaded && (
              <View style={styles.adLoadingContainer}>
                <ActivityIndicator size="small" color={colors.primary[500]} />
                <Text style={styles.adLoadingText}>
                  {t('common.loading')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const renderResultsModal = () => {
    if (!assessment) return null;

    return (
      <Modal
        visible={showResultsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResultsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.modalContent}>
              {/* Header with Score */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t('writing.evaluation.title')}
                </Text>

                {isUsingCachedResult && (
                  <View style={styles.cacheInfo}>
                    <Text style={styles.cacheInfoText}>
                      {t('writing.mock.cacheInfo')}
                    </Text>
                  </View>
                )}

                <View style={styles.scoreSection}>
                  <Text style={styles.scoreLabel}>{t('writing.evaluation.totalScore')}</Text>
                  <Text style={[styles.scoreValue, { color: getScoreColor(assessment.overallScore, assessment.maxScore) }]}>
                    {assessment.overallScore} / {assessment.maxScore}
                  </Text>
                </View>
              </View>

              {/* Content Points Results */}
              <View style={styles.detailedResultsContainer}>
                <Text style={styles.detailedResultsTitle}>
                  {t('practice.writing.taskPoints')}
                </Text>
                {assessment.contentPoints.map((point, index) => (
                  <View key={index} style={styles.resultItem}>
                    <View style={styles.resultItemHeader}>
                      <View style={[
                        styles.resultQuestionNumber,
                        point.score === 3 ? styles.resultQuestionNumberCorrect :
                          point.score === 1.5 ? styles.resultQuestionNumberPartial :
                            styles.resultQuestionNumberIncorrect
                      ]}>
                        <Text style={styles.resultQuestionNumberText}>{point.pointNumber}</Text>
                      </View>
                      <Text style={styles.resultTaskText}>
                        {point.pointText}
                      </Text>
                      <Text style={styles.pointScore}>
                        {point.score}/3
                      </Text>
                    </View>
                    <Text style={styles.pointFeedback}>
                      {point.feedback}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Communicative Design */}
              <View style={styles.communicativeDesignSection}>
                <Text style={styles.sectionTitle}>
                  {t('practice.writing.communicativeDesign')}
                </Text>
                <View style={styles.communicativeDesignCard}>
                  <View style={styles.communicativeDesignHeader}>
                    <Text style={styles.communicativeDesignScore}>
                      {assessment.communicativeDesign.score}/1
                    </Text>
                  </View>
                  <Text style={styles.communicativeDesignFeedback}>
                    {assessment.communicativeDesign.feedback}
                  </Text>
                </View>
              </View>

              {/* User Input */}
              <View style={styles.userInputSection}>
                <Text style={styles.userInputTitle}>{t('writing.evaluation.userInput')}</Text>
                <Text style={styles.userInputText}>{assessment.userInput || t('writing.evaluation.noUserInput')}</Text>
              </View>

              {/* Corrected Answer */}
              <View style={styles.correctedAnswerSection}>
                <Text style={styles.correctedAnswerTitle}>{t('writing.evaluation.correctedAnswer')}</Text>
                <View style={styles.correctedAnswerContainer}>
                  <MarkdownText text={assessment.correctedAnswer} />
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setShowResultsModal(false)}
              >
                <Text style={styles.closeModalButtonText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderImagePreviewModal = () => {
    if (!capturedImageUri) return null;

    return (
      <Modal
        visible={isImagePreviewModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImagePreviewModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.imagePreviewModalContent]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.imagePreviewTitle}>
                {t('writing.imagePreview.title')}
              </Text>

              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: capturedImageUri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.imagePreviewButtonsContainer}>
                <TouchableOpacity
                  style={[styles.imagePreviewButton, styles.retakeButton]}
                  onPress={() => {
                    setIsImagePreviewModalOpen(false);
                    setTimeout(handleTakePhoto, 300);
                  }}
                >
                  <Text style={styles.retakeIcon}>📷</Text>
                  <Text style={[styles.imagePreviewButtonText, styles.retakeButtonText]}>{t('writing.imagePreview.retakeButton')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.imagePreviewButton, styles.evaluateImageButton]}
                  onPress={handleEvaluateImage}
                  disabled={isEvaluating}
                >
                  {isEvaluating ? (
                    <ActivityIndicator color={colors.text.primary} size="small" />
                  ) : (
                    <>
                      <Text style={styles.evaluateIcon}>✓</Text>
                      <Text style={[styles.imagePreviewButtonText, styles.evaluateButtonText]}>{t('writing.imagePreview.evaluateButton')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.cancelImageButton}
                onPress={() => {
                  setIsImagePreviewModalOpen(false);
                  setCapturedImageUri(null);
                  setCapturedImageBase64(null);
                  capturedImageUriRef.current = null;
                  capturedImageBase64Ref.current = null;
                }}
              >
                <Text style={styles.cancelImageButtonText}>{t('writing.imagePreview.cancelButton')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderFullScreenLoading = () => {
    return (
      <Modal visible={isEvaluating} transparent={true} animationType="fade">
        <View style={styles.fullScreenLoadingContainer}>
          <ActivityIndicator color={colors.background.secondary} size="large" />
          <Text style={styles.fullScreenLoadingText}>{t('writing.evaluation.loading')}</Text>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('exam.loadingExam')}</Text>
        </View>
      </View>
    );
  }

  if (!currentExam) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('exam.failedToLoad')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderFullScreenLoading()}
      {renderRewardedAdModal()}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>


        {/* Instruction */}
        {currentExam.instruction_header && (
          <Text style={styles.instructionText}>{currentExam.instruction_header}</Text>
        )}

        {/* Task Points */}
        <View style={styles.taskPointsCard}>
          <Text style={styles.taskPointsTitle}>{t('practice.writing.taskPoints')}</Text>
          {currentExam.task_points.map((point: any, index: number) => (
            <View key={point.id} style={styles.taskPointRow}>
              <View style={styles.taskPointNumber}>
                <Text style={styles.taskPointNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.taskPointText}>{point.text}</Text>
            </View>
          ))}
        </View>

        {/* Constraints/Hints */}
        {currentExam.constraints && (
          <View style={styles.hintsCard}>
            {currentExam.constraints.text_length_hint && (
              <Text style={styles.hintText}>💡 {currentExam.constraints.text_length_hint}</Text>
            )}
            {currentExam.constraints.structure_hint && (
              <Text style={styles.hintText}>💡 {currentExam.constraints.structure_hint}</Text>
            )}
          </View>
        )}

        {/* Text Input */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>{t('practice.writing.yourText')}</Text>
          <TextInput
            style={styles.textInput}
            multiline
            placeholder={t('practice.writing.emailPlaceholder')}
            placeholderTextColor={colors.text.secondary}
            value={userText}
            onChangeText={handleTextChange}
            textAlignVertical="top"
          />
          <View style={styles.countersRow}>
            <Text style={styles.counterText}>
              {t('practice.writing.characters')}: {userText.length}
            </Text>
            <Text style={styles.counterText}>
              {t('practice.writing.words')}: {getWordCount()}
            </Text>
          </View>
        </View>

        {/* Camera Button */}
        <View style={styles.cameraSection}>
          <Text style={styles.orText}>{t('writing.camera.orText')}</Text>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleTakePhoto}
          >
            <Text style={styles.cameraButtonText}>{t('writing.camera.buttonText')}</Text>
          </TouchableOpacity>
        </View>

        {/* Evaluate Button */}
        <TouchableOpacity
          style={[styles.evaluateButton, isEvaluating && styles.evaluateButtonDisabled]}
          onPress={handleEvaluate}
          disabled={isEvaluating}
        >
          {isEvaluating ? (
            <ActivityIndicator color={colors.background.secondary} />
          ) : (
            <Text style={styles.evaluateButtonText}>{t('writing.buttons.evaluate')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {renderResultsModal()}
      {renderImagePreviewModal()}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    fullScreenLoadingContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: Dimensions.get('window').height,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
    },
    fullScreenLoadingText: {
      ...typography.textStyles.h4,
      color: colors.white,
      marginTop: spacing.margin.md,
      textAlign: 'center',
      paddingHorizontal: '20%',
      textShadowOffset: {
        width: 1,
        height: 1,
      },
      textShadowRadius: 10,
      textShadowColor: colors.black,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.padding.lg,
      paddingBottom: spacing.padding.xl * 2,
    },
    headerButton: {
      marginRight: spacing.margin.md,
      padding: spacing.padding.sm,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.padding.lg,
    },
    errorText: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    examTitle: {
      ...typography.textStyles.h4,
      color: colors.text.primary,
      textAlign: 'center',
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.margin.md,
    },
    instructionCard: {
      backgroundColor: colors.primary[50],
      padding: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
      marginBottom: spacing.margin.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary[500],
    },
    instructionText: {
      ...typography.textStyles.h4,
      color: colors.text.primary,
      marginBottom: spacing.margin.sm,
      textAlign: 'left',
    },
    taskPointsCard: {
      backgroundColor: colors.background.secondary,
      padding: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
      marginBottom: spacing.margin.md,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    taskPointsTitle: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.margin.sm,
      textAlign: 'left',
    },
    taskPointRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.margin.sm,
      gap: spacing.margin.sm,
      direction: 'ltr',
    },
    taskPointNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.text.secondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    taskPointNumberText: {
      ...typography.textStyles.bodySmall,
      color: colors.white,
      fontWeight: typography.fontWeight.bold,
    },
    taskPointText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      textAlign: 'left',
      lineHeight: 18,
    },
    hintsCard: {
      backgroundColor: colors.warning[50],
      padding: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
      marginBottom: spacing.margin.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.warning[500],
      gap: spacing.margin.xs,
      direction: 'ltr',
    },
    hintText: {
      ...typography.textStyles.bodySmall,
      color: colors.text.primary,
      textAlign: 'left',
      lineHeight: 20,
    },
    inputSection: {
      marginBottom: spacing.margin.lg,
    },
    sectionTitle: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.margin.sm,
      textAlign: 'left',
    },
    textInput: {
      ...typography.textStyles.body,
      backgroundColor: colors.background.secondary,
      borderWidth: 2,
      borderColor: colors.border.light,
      borderRadius: spacing.borderRadius.md,
      padding: spacing.padding.md,
      color: colors.text.primary,
      minHeight: 200,
      textAlign: 'left',
    },
    countersRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.margin.sm,
    },
    counterText: {
      ...typography.textStyles.bodySmall,
      color: colors.text.secondary,
    },
    cameraSection: {
      marginBottom: spacing.margin.lg,
      alignItems: 'center',
    },
    orText: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      marginBottom: spacing.margin.md,
      fontWeight: typography.fontWeight.bold,
    },
    cameraButton: {
      backgroundColor: colors.primary[100],
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      borderRadius: spacing.borderRadius.md,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.primary[300],
      borderStyle: 'dashed',
      width: '100%',
      marginBottom: spacing.margin.sm,
    },
    cameraButtonText: {
      ...typography.textStyles.body,
      fontWeight: typography.fontWeight.semibold,
      color: colors.primary[700],
    },
    evaluateButton: {
      backgroundColor: colors.primary[500],
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      borderRadius: spacing.borderRadius.md,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    evaluateButtonDisabled: {
      opacity: 0.6,
    },
    evaluateButtonText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.bold,
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.padding.lg,
    },
    modalScrollView: {
      width: '100%',
      maxHeight: '90%',
    },
    modalScrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.padding.md,
      width: '100%',
      maxWidth: 500,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
      marginVertical: spacing.margin.lg,
    },
    modalHeader: {
      marginBottom: spacing.margin.md,
      paddingBottom: spacing.padding.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    modalTitle: {
      ...typography.textStyles.h5,
      color: colors.text.primary,
      marginBottom: spacing.margin.md,
      textAlign: 'center',
      fontWeight: typography.fontWeight.bold,
    },
    cacheInfo: {
      backgroundColor: colors.primary[50],
      padding: spacing.padding.sm,
      borderRadius: spacing.borderRadius.sm,
      marginBottom: spacing.margin.md,
      borderWidth: 1,
      borderColor: colors.primary[300],
    },
    cacheInfoText: {
      ...typography.textStyles.bodySmall,
      color: colors.primary[700],
      textAlign: 'center',
    },
    scoreSection: {
      backgroundColor: colors.primary[50],
      padding: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    scoreLabel: {
      ...typography.textStyles.h5,
      color: colors.text.primary,
    },
    scoreValue: {
      ...typography.textStyles.h3,
      fontWeight: typography.fontWeight.bold,
    },
    detailedResultsContainer: {
      marginBottom: spacing.margin.md,
      width: '100%',
    },
    detailedResultsTitle: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.margin.sm,
      textAlign: 'left',
    },
    resultItem: {
      backgroundColor: colors.background.primary,
      padding: spacing.padding.sm,
      borderRadius: spacing.borderRadius.sm,
      marginBottom: spacing.margin.sm,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    resultItemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.margin.xs,
      marginBottom: spacing.margin.xs,
    },
    resultQuestionNumber: {
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
    },
    resultQuestionNumberCorrect: {
      backgroundColor: colors.success[500],
    },
    resultQuestionNumberPartial: {
      backgroundColor: colors.warning[500],
    },
    resultQuestionNumberIncorrect: {
      backgroundColor: colors.error[500],
    },
    resultQuestionNumberText: {
      ...typography.textStyles.bodySmall,
      fontSize: 11,
      color: colors.white,
      fontWeight: typography.fontWeight.bold,
    },
    resultTaskText: {
      ...typography.textStyles.bodySmall,
      color: colors.text.primary,
      flex: 1,
      textAlign: 'left',
    },
    pointScore: {
      ...typography.textStyles.bodySmall,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.bold,
    },
    pointFeedback: {
      ...typography.textStyles.bodySmall,
      color: colors.text.secondary,
      marginLeft: 30,
      textAlign: 'left',
      fontStyle: 'italic',
    },
    communicativeDesignSection: {
      marginBottom: spacing.margin.md,
    },
    communicativeDesignCard: {
      backgroundColor: colors.background.primary,
      padding: spacing.padding.md,
      borderRadius: spacing.borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    communicativeDesignHeader: {
      marginBottom: spacing.margin.xs,
    },
    communicativeDesignScore: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.bold,
    },
    communicativeDesignFeedback: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      textAlign: 'left',
      fontStyle: 'italic',
    },
    userInputSection: {
      backgroundColor: colors.background.primary,
      padding: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
      marginBottom: spacing.margin.md,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    userInputTitle: {
      ...typography.textStyles.body,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: spacing.margin.sm,
      textAlign: 'left',
    },
    userInputText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      lineHeight: 22,
      textAlign: 'left',
    },
    correctedAnswerSection: {
      backgroundColor: colors.primary[50],
      padding: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
      marginBottom: spacing.margin.md,
      borderWidth: 2,
      borderColor: colors.primary[300],
    },
    correctedAnswerTitle: {
      ...typography.textStyles.body,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary[700],
      marginBottom: spacing.margin.sm,
      textAlign: 'left',
    },
    correctedAnswerContainer: {
      flexDirection: 'column',
    },
    closeModalButton: {
      backgroundColor: colors.primary[500],
      paddingVertical: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.margin.md,
    },
    closeModalButtonText: {
      ...typography.textStyles.body,
      fontWeight: typography.fontWeight.bold,
      color: colors.background.secondary,
    },
    imagePreviewModalContent: {
      maxHeight: '90%',
    },
    imagePreviewTitle: {
      ...typography.textStyles.h4,
      color: colors.primary[600],
      textAlign: 'center',
      marginBottom: spacing.margin.sm,
    },
    imageContainer: {
      marginBottom: spacing.margin.sm,
    },
    previewImage: {
      width: '100%',
      height: 300,
    },
    imagePreviewButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.margin.sm,
      gap: spacing.margin.sm,
    },
    imagePreviewButton: {
      flex: 1,
      paddingVertical: spacing.padding.sm,
      paddingHorizontal: spacing.padding.md,
      borderRadius: spacing.borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: spacing.margin.xs,
    },
    retakeButton: {
      backgroundColor: colors.warning[100],
      borderWidth: 1,
      borderColor: colors.warning[500],
    },
    evaluateImageButton: {
      backgroundColor: colors.background.secondary,
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    imagePreviewButtonText: {
      ...typography.textStyles.bodySmall,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      textAlign: 'center',
    },
    retakeButtonText: {
      color: colors.warning[700],
    },
    retakeIcon: {
      fontSize: 14,
    },
    evaluateIcon: {
      fontSize: 14,
      color: colors.text.primary,
    },
    cancelImageButton: {
      backgroundColor: 'transparent',
      paddingVertical: spacing.padding.sm,
      borderRadius: spacing.borderRadius.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.error[500],
    },
    cancelImageButtonText: {
      ...typography.textStyles.bodySmall,
      fontWeight: typography.fontWeight.medium,
      color: colors.error[500],
    },
    rewardedAdModalContent: {
      padding: spacing.padding.xl,
    },
    rewardedAdModalTitle: {
      ...typography.textStyles.h4,
      color: colors.primary[700],
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.margin.md,
      textAlign: 'center',
    },
    rewardedAdModalMessage: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      lineHeight: 24,
      marginBottom: spacing.margin.xl,
      textAlign: 'center',
    },
    rewardedAdModalButtons: {
      width: '100%',
    },
    rewardedAdModalButton: {
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      borderRadius: spacing.borderRadius.md,
      alignItems: 'center',
      marginBottom: spacing.margin.md,
    },
    watchAdButton: {
      backgroundColor: colors.primary[500],
    },
    maybeLaterButton: {
      backgroundColor: colors.background.secondary,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    rewardedAdModalButtonText: {
      ...typography.textStyles.body,
      fontWeight: typography.fontWeight.bold,
      color: colors.background.secondary,
      textAlign: 'center',
    },
    maybeLaterButtonText: {
      color: colors.text.secondary,
    },
    adLoadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.margin.md,
      paddingTop: spacing.padding.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    adLoadingText: {
      ...typography.textStyles.bodySmall,
      color: colors.text.secondary,
      marginLeft: spacing.margin.sm,
    },
  });

export default WritingPart2Screen;
