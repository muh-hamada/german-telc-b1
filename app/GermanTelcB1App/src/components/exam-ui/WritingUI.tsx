import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  PermissionsAndroid,
  Dimensions,
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useModalQueue } from '../../contexts/ModalQueueContext';
import { usePremium } from '../../contexts/PremiumContext';
import { spacing, typography, type ThemeColors } from '../../theme';
import { useAppTheme } from '../../contexts/ThemeContext';
import { UserAnswer, WritingExam } from '../../types/exam.types';
import {
  evaluateWriting,
  evaluateWritingWithImage,
  WritingAssessment,
} from '../../services/http.openai.service';
import { RewardedAd, RewardedAdEventType, TestIds, AdEventType } from 'react-native-google-mobile-ads';
import { SKIP_REWARDED_ADS } from '../../config/development.config';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { activeExamConfig } from '../../config/active-exam.config';
import WritingResultsModal from './WritingResultsModal';

// In the Telc exam, the initiatial evaluation if from 15
// Then we multiply by 3 to reach a max score of 45
// For the Dele exams, we do not multiply at all, so the max score is 25
const SCORE_MULTIPLIER = activeExamConfig.provider === 'dele' ? 1 : 3;

const MIN_ANSWER_LENGTH = 50;

interface WritingUIProps {
  exam: WritingExam;
  onComplete: (score: number, answers: UserAnswer[]) => void;
  isMockExam?: boolean; // Optional flag to indicate if this is part of a mock exam
  part?: number; // Optional part number (1 or 2) - this is used for the Dele exams
}

// Ad Unit ID for rewarded ad
const REWARDED_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.select({
    ios: activeExamConfig.ads.rewarded.ios,
    android: activeExamConfig.ads.rewarded.android,
  }) || TestIds.REWARDED;

const WritingUI: React.FC<WritingUIProps> = ({ exam, onComplete, isMockExam = false, part = 1 }) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { setContextualModalActive } = useModalQueue();
  const { isPremium } = usePremium();
  const [userAnswer, setUserAnswer] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [assessment, setAssessment] = useState<WritingAssessment | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [lastEvaluatedAnswer, setLastEvaluatedAnswer] = useState('');
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [isImagePreviewModalOpen, setIsImagePreviewModalOpen] = useState(false);
  const [isUsingCachedResult, setIsUsingCachedResult] = useState(false);
  const [showRewardedAdModal, setShowRewardedAdModal] = useState(false);
  const [rewardedAd, setRewardedAd] = useState<RewardedAd | null>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [adLoadFailed, setAdLoadFailed] = useState(false);
  const [pendingEvaluationType, setPendingEvaluationType] = useState<'text' | 'image' | null>(null);
  const pendingEvaluationTypeRef = useRef<'text' | 'image' | null>(null);
  const capturedImageUriRef = useRef<string | null>(null);
  const capturedImageBase64Ref = useRef<string | null>(null);
  const adEarnedRewardRef = useRef<boolean>(false);
  const userAnswerRef = useRef<string>('');

  const isB2Exam = activeExamConfig.level === 'B2';
  const isDele = activeExamConfig.provider === 'dele';

  // Reset state when exam changes (e.g., moving from writing-1 to writing-2)
  useEffect(() => {
    setUserAnswer('');
    setShowWarning(false);
    setAssessment(null);
    setLastEvaluatedAnswer('');
    setCapturedImageUri(null);
    capturedImageUriRef.current = null;
    capturedImageBase64Ref.current = null;
    userAnswerRef.current = '';
    setIsResultsModalOpen(false);
    setIsImagePreviewModalOpen(false);
    setIsUsingCachedResult(false);
  }, [exam]);

  // Initialize and load rewarded ad
  useEffect(() => {
    const ad = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });

    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('[WritingScreen] ✅ Rewarded ad loaded successfully');
      setIsAdLoaded(true);
      setAdLoadFailed(false); // Reset failure flag on successful load
    });

    const unsubscribeEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        console.log('[WritingScreen] 🎁 User earned reward:', reward);
        adEarnedRewardRef.current = true;
        logEvent(AnalyticsEvents.REWARDED_AD_EARNED_REWARD, { ad_unit_id: REWARDED_AD_UNIT_ID });
        // Don't start evaluation yet - wait for CLOSED event
        console.log('[WritingScreen] 💾 Reward earned, waiting for ad to close before starting evaluation');
      }
    );

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('[WritingScreen] ❌ Rewarded ad closed', {
        earnedReward: adEarnedRewardRef.current,
        pendingEvaluationType: pendingEvaluationTypeRef.current
      });
      logEvent(AnalyticsEvents.REWARDED_AD_CLOSED, { ad_unit_id: REWARDED_AD_UNIT_ID });

      // Check if user actually earned the reward
      if (!adEarnedRewardRef.current) {
        // User closed the ad without watching - reset everything
        console.log('[WritingScreen] ⚠️ Ad closed without earning reward - resetting state');
        setPendingEvaluationType(null);
        pendingEvaluationTypeRef.current = null;
        setShowRewardedAdModal(false);
        setIsEvaluating(false);
      } else {
        // User earned the reward - NOW start the evaluation
        console.log('[WritingScreen] ✅ Ad closed after earning reward - starting evaluation NOW');
        setShowRewardedAdModal(false);

        // Start evaluation now that ad is closed
        const evaluationType = pendingEvaluationTypeRef.current;
        console.log('[WritingScreen] 📝 Starting evaluation type:', evaluationType);
        if (evaluationType === 'text') {
          proceedWithTextEvaluation();
        } else if (evaluationType === 'image') {
          proceedWithImageEvaluation();
        }
      }

      // Reset the flag for next time (after we've checked it above)
      const hadEarnedReward = adEarnedRewardRef.current;
      adEarnedRewardRef.current = false;

      // Reload ad for next time
      setIsAdLoaded(false);
      console.log('[WritingScreen] 🔄 Reloading ad for next time');
      ad.load();

      // Clean up pending evaluation type after a delay (only if reward wasn't earned)
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

      // Reset all modal and loading states on error
      console.log('[WritingScreen] 🧹 Error cleanup - resetting all states');
      setIsAdLoaded(false);
      setAdLoadFailed(true); // Mark ad as failed so user can still evaluate
      setShowRewardedAdModal(false);
      setIsEvaluating(false);
      setPendingEvaluationType(null);
      pendingEvaluationTypeRef.current = null;
      adEarnedRewardRef.current = false;

      // Retry loading after a delay
      setTimeout(() => {
        console.log('[WritingScreen] 🔄 Retrying ad load after error');
        ad.load();
      }, 5000);
    });

    // Load the ad
    console.log('[WritingScreen] 📱 Initializing rewarded ad');
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

  // Debug: Log modal states
  useEffect(() => {
    console.log('[WritingScreen] 📊 Modal States:', {
      showRewardedAdModal,
      isImagePreviewModalOpen,
      isResultsModalOpen,
      isEvaluating,
      pendingEvaluationType,
      isAdLoaded
    });
  }, [showRewardedAdModal, isImagePreviewModalOpen, isResultsModalOpen, isEvaluating, pendingEvaluationType, isAdLoaded]);

  // Pause global modal queue when any writing modal is open
  useEffect(() => {
    const isAnyModalOpen = isResultsModalOpen || isImagePreviewModalOpen || showRewardedAdModal || isEvaluating;
    setContextualModalActive(isAnyModalOpen);
  }, [isResultsModalOpen, isImagePreviewModalOpen, showRewardedAdModal, isEvaluating, setContextualModalActive]);

  const handleAnswerChange = (text: string) => {
    setUserAnswer(text);
    userAnswerRef.current = text; // Keep ref in sync
    if (showWarning && text.trim().length >= MIN_ANSWER_LENGTH) {
      setShowWarning(false);
    }
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
    return true; // iOS permissions are handled by Info.plist
  };

  const handleTakePhoto = async () => {
    // Check if the module is available
    if (!launchCamera) {
      Alert.alert(
        t('writing.alerts.cameraNotAvailable'),
        t('writing.alerts.cameraNotAvailableMessage'),
        [{ text: t('writing.alerts.ok') }]
      );
      return;
    }

    // Request camera permission
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
      includeBase64: true, // Request base64 data
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('[WritingScreen] User cancelled camera');
      } else if (response.errorCode) {
        Alert.alert(t('writing.alerts.cameraError'), t('writing.alerts.cameraErrorMessage'));
        console.error('[WritingScreen] Camera error:', response);
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const imageUri = asset.uri;
        const imageBase64 = asset.base64;

        if (imageUri && imageBase64) {
          setCapturedImageUri(imageUri);
          capturedImageUriRef.current = imageUri;
          capturedImageBase64Ref.current = imageBase64;
          setIsImagePreviewModalOpen(true);
        } else if (imageUri) {
          // Fallback if base64 is not available
          setCapturedImageUri(imageUri);
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

    // Check if answer hasn't changed since last evaluation
    if (imageIdentifier === lastEvaluatedAnswer && assessment) {
      console.log('[WritingScreen] Image unchanged, showing cached assessment directly');
      setIsImagePreviewModalOpen(false);
      setIsUsingCachedResult(true);
      setIsResultsModalOpen(true);
      return;
    }

    // Show rewarded ad modal before evaluation
    setIsImagePreviewModalOpen(false);
    setPendingEvaluationType('image');
    pendingEvaluationTypeRef.current = 'image';

    // Skip rewarded ad for premium users, if SKIP_REWARDED_ADS is enabled, or if ad failed to load
    if (SKIP_REWARDED_ADS || isPremium || adLoadFailed) {
      if(adLoadFailed) {
        logEvent(AnalyticsEvents.WRITING_EVAL_FREE_AD_FAILED, { evaluation_type: 'image' });
      }
      await proceedWithImageEvaluation();
    } else {
      logEvent(AnalyticsEvents.REWARDED_AD_PROMPT_SHOWN, { reason: 'writing_evaluation' });
      setShowRewardedAdModal(true);
    }
  };

  const proceedWithImageEvaluation = async () => {
    setIsEvaluating(true);
    setIsUsingCachedResult(false); // This is a fresh evaluation (image)

    try {
      let result: WritingAssessment;

      // Use ref values which persist even if state is lost during ad display
      const imageBase64 = capturedImageBase64Ref.current;
      const imageUri = capturedImageUriRef.current;

      // Call OpenAI API for image evaluation
      // Use base64 if available, otherwise use URI
      if (imageBase64) {
        result = await evaluateWritingWithImage({
          imageBase64: imageBase64,
          incomingEmail: exam.incomingEmail,
          writingPoints: exam.writingPoints,
          examTitle: exam.title,
        });
      } else if (imageUri) {
        result = await evaluateWritingWithImage({
          imageUri: imageUri,
          incomingEmail: exam.incomingEmail,
          writingPoints: exam.writingPoints,
          examTitle: exam.title,
        });
      } else {
        throw new Error('No image available');
      }

      setLastEvaluatedAnswer(`[IMAGE:${imageUri}]`);
      setAssessment(result);
      setIsResultsModalOpen(true);
      logEvent(AnalyticsEvents.WRITING_EVAL_COMPLETED, { overall_score: result.overallScore * SCORE_MULTIPLIER, max_score: result.maxScore * SCORE_MULTIPLIER });

      // Call onComplete to save progress and move to next step
      const answers: UserAnswer[] = [];
      answers.push({
        questionId: 0,
        answer: '[IMAGE]',
        isCorrect: true,
        timestamp: Date.now(),
        correctAnswer: undefined,
        assessment: result, // Store the assessment for later viewing
      });
      onComplete(result.overallScore * SCORE_MULTIPLIER, answers);
    } catch (error) {
      console.error('Evaluation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Log error to analytics
      logEvent(AnalyticsEvents.WRITING_EVAL_FAILED, {
        error_message: errorMessage,
        evaluation_type: 'image'
      });

      Alert.alert(
        t('writing.alerts.evaluationError'),
        error instanceof Error ? error.message : t('writing.alerts.evaluationErrorMessage'),
        [
          { text: t('writing.alerts.ok'), style: 'default' },
        ]
      );
    } finally {
      setIsEvaluating(false);
      setPendingEvaluationType(null);
      pendingEvaluationTypeRef.current = null;
    }
  };

  const handleEvaluate = async () => {
    if (userAnswer.trim().length < MIN_ANSWER_LENGTH) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);

    // Check if answer hasn't changed since last evaluation
    if (userAnswer === lastEvaluatedAnswer && assessment) {
      console.log('[WritingScreen] Answer unchanged, showing cached assessment directly');
      setIsUsingCachedResult(true);
      setIsResultsModalOpen(true);
      return;
    }

    // Store the current answer in ref so it's available in the closure
    userAnswerRef.current = userAnswer;

    // Show rewarded ad modal before evaluation
    setPendingEvaluationType('text');
    pendingEvaluationTypeRef.current = 'text';

    // Skip rewarded ad for premium users, if SKIP_REWARDED_ADS is enabled, or if ad failed to load
    if (SKIP_REWARDED_ADS || isPremium || adLoadFailed) {
      if(adLoadFailed) {
        logEvent(AnalyticsEvents.WRITING_EVAL_FREE_AD_FAILED, { evaluation_type: 'text' });
      }
      await proceedWithTextEvaluation();
    } else {
      logEvent(AnalyticsEvents.REWARDED_AD_PROMPT_SHOWN, { reason: 'writing_evaluation' });
      setShowRewardedAdModal(true);
    }
  };

  const proceedWithTextEvaluation = async () => {
    setIsEvaluating(true);
    setIsUsingCachedResult(false); // This is a fresh evaluation

    try {
      let result: WritingAssessment;

      // Use ref value which persists even if state is stale in closure
      const answerToEvaluate = userAnswerRef.current;
      console.log('[WritingScreen] Evaluating text:', answerToEvaluate.substring(0, 50) + '...');

      // Call OpenAI API for text evaluation
      result = await evaluateWriting({
        userAnswer: answerToEvaluate,
        incomingEmail: exam.incomingEmail,
        writingPoints: exam.writingPoints,
        examTitle: exam.title,
      });

      setLastEvaluatedAnswer(answerToEvaluate);
      setAssessment(result);
      setIsResultsModalOpen(true);
      logEvent(AnalyticsEvents.WRITING_EVAL_COMPLETED, { overall_score: result.overallScore * SCORE_MULTIPLIER, max_score: result.maxScore * SCORE_MULTIPLIER });

      // Call onComplete to save progress and move to next step
      const answers: UserAnswer[] = [];
      answers.push({
        questionId: 0,
        answer: result.userInput,
        isCorrect: true,
        timestamp: Date.now(),
        correctAnswer: undefined,
        assessment: result, // Store the assessment for later viewing
      });
      onComplete(result.overallScore * SCORE_MULTIPLIER, answers);
    } catch (error) {
      console.error('Evaluation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Log error to analytics
      logEvent(AnalyticsEvents.WRITING_EVAL_FAILED, {
        error_message: errorMessage,
        evaluation_type: 'text'
      });

      Alert.alert(
        t('writing.alerts.evaluationError'),
        error instanceof Error ? error.message : t('writing.alerts.evaluationErrorMessage'),
        [
          { text: t('writing.alerts.ok'), style: 'default' },
        ]
      );
    } finally {
      setIsEvaluating(false);
      setPendingEvaluationType(null);
      pendingEvaluationTypeRef.current = null;
    }
  };

  const handleWatchAdAndEvaluate = () => {
    console.log('[WritingScreen] handleWatchAdAndEvaluate called', {
      hasAd: !!rewardedAd,
      isAdLoaded,
      pendingEvaluationType
    });

    if (!rewardedAd || !isAdLoaded) {
      console.log('[WritingScreen] Ad not ready, showing alert');
      Alert.alert(
        t('writing.rewardedAdModal.adNotReady'),
        '',
        [{ text: t('writing.alerts.ok') }]
      );
      // Reset states since we can't show the ad
      setShowRewardedAdModal(false);
      setPendingEvaluationType(null);
      pendingEvaluationTypeRef.current = null;
      return;
    }

    console.log('[WritingScreen] Preparing to show rewarded ad...');
    logEvent(AnalyticsEvents.REWARDED_AD_OPENED, { ad_unit_id: REWARDED_AD_UNIT_ID });
    adEarnedRewardRef.current = false; // Reset flag before showing ad

    // Close the modal first
    setShowRewardedAdModal(false);

    // Wait longer to ensure modal is fully dismissed on native side before showing ad
    // iOS requires time to dismiss the modal's view controller before presenting another one
    setTimeout(() => {
      console.log('[WritingScreen] Calling rewardedAd.show()');
      try {
        rewardedAd.show();
      } catch (showError) {
        console.error('[WritingScreen] Error calling show():', showError);
        logEvent(AnalyticsEvents.REWARDED_AD_ERROR, { ad_unit_id: REWARDED_AD_UNIT_ID, error_code: 'show_failed' });

        // If showing the ad fails, the error event listener will handle cleanup
        // But we also need to clean up here in case the error event doesn't fire
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

                  <Text style={[styles.imagePreviewButtonText]}>{t('writing.imagePreview.retakeButton')}</Text>
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
                      <Text style={[styles.imagePreviewButtonText]}>{t('writing.imagePreview.evaluateButton')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.cancelImageButton}
                onPress={() => {
                  setIsImagePreviewModalOpen(false);
                  setCapturedImageUri(null);
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

  const renderExamContent = () => {
    if (isB2Exam) {
      return renderB2Theme1Question();
    }

    return renderB1Question();
  }

  const renderB1Question = () => {
    const isMessageQuestion = isDele && part === 2;
    const instructionsText =  isMessageQuestion ? t('writing.instructions.dele.part2.description') :  t('writing.instructions.description');

    return (
      <>
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>{t('writing.instructions.title')}</Text>
          <Text style={styles.instructionsText}>{instructionsText}</Text>
        </View>

        {/* Incoming Email */}
        {!!exam.incomingEmail && (
          <View style={styles.emailSection}>
            <Text style={styles.sectionTitle}>{t('writing.sections.incomingEmail')}</Text>
            <View style={styles.emailCard}>
              <Text style={styles.emailText}>{exam.incomingEmail}</Text>
            </View>
          </View>
        )}

        {/* Writing Points */}
        {exam.writingPoints && exam.writingPoints.length > 0 && (
          <View style={styles.pointsSection}>
            <Text style={styles.sectionTitle}>{t('writing.sections.writingPoints')}</Text>
            {exam.writingPoints.map((point, index) => (
              <View key={index} style={styles.pointItem}>
                <Text style={styles.pointBullet}>•</Text>
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
          </View>
        )}
      </>
    )
  }

  const renderB2Theme1Question = () => {
    return (
      <>
        <View style={[styles.instructionsCard, styles.b2Theme1InstructionsCard]}>
          <Text style={styles.instructionsTitle}>{exam.uiStrings?.instructionTitle}</Text>
          <Text style={styles.instructionsText}>{exam.uiStrings?.instructionDescription}</Text>
        </View>

        {/* Incoming Email */}
        {exam.incomingEmail && (
          <View style={styles.emailSection}>
            <View style={styles.emailCard}>
              <Text style={styles.emailText}>{exam.incomingEmail}</Text>
            </View>
          </View>
        )}

        {/* Writing Points */}
        {exam.writingPoints && exam.writingPoints.length > 0 && (
          <View style={styles.pointsSection}>
            <Text style={[styles.sectionTitle, styles.b2Theme1SectionTitle]}>{exam.uiStrings?.taskDescription}</Text>
            {exam.writingPoints.map((point, index) => (
              <View key={index} style={styles.pointItem}>
                <Text style={styles.pointText}>• {point}</Text>
              </View>
            ))}
            <Text style={[styles.sectionTitle, styles.b2Theme1SectionTitle]}>{exam.uiStrings?.taskFooter}</Text>
          </View>
        )}
      </>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {renderFullScreenLoading()}
      {renderRewardedAdModal()}
      {renderExamContent()}

      {/* Answer Input */}
      <View style={styles.answerSection}>
        <Text style={styles.sectionTitle}>{t('writing.sections.yourAnswer')}</Text>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder={t('writing.input.placeholder')}
          placeholderTextColor={colors.text.secondary}
          value={userAnswer}
          onChangeText={handleAnswerChange}
          textAlignVertical="top"
        />
        <View style={styles.warningContainer}>
          {showWarning && (
            <Text style={styles.warningText}>
              {t('writing.input.minCharactersWarning')}
            </Text>
          )}
          <Text style={styles.characterCount}>
            {userAnswer.length} {t('writing.input.characterCount')}
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

      <WritingResultsModal
        isOpen={isResultsModalOpen && !isMockExam} // Do not show the results modal in mock exam mode
        onClose={() => setIsResultsModalOpen(false)}
        assessment={assessment}
        isUsingCachedResult={isUsingCachedResult}
        exam={exam}
      />
      {renderImagePreviewModal()}
    </ScrollView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    position: 'relative',
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
  scrollContent: {
    padding: spacing.padding.lg,
  },
  instructionsCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  b2Theme1InstructionsCard: {
    padding: 0,
    borderLeftWidth: 0,
    borderLeftColor: 'transparent',
    backgroundColor: 'transparent',
    marginBottom: spacing.margin.sm,
  },
  instructionsTitle: {
    ...typography.textStyles.h4,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
  },
  instructionsText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  emailSection: {
    marginBottom: spacing.margin.xl,
  },
  sectionTitle: {
    ...typography.textStyles.h5,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
    textAlign: 'left',
  },
  b2Theme1SectionTitle: {
    ...typography.textStyles.body,
    direction: 'ltr',
  },
  emailCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  emailText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
    direction: 'ltr',
  },
  pointsSection: {
    marginBottom: spacing.margin.lg,
  },
  pointItem: {
    flexDirection: 'row',
    marginBottom: spacing.margin.xs,
    paddingLeft: spacing.padding.sm,
  },
  pointBullet: {
    ...typography.textStyles.body,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
    marginRight: spacing.margin.sm,
  },
  pointText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },
  answerSection: {

  },
  textInput: {
    ...typography.textStyles.body,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.padding.md,
    minHeight: 200,
    borderWidth: 1,
    borderColor: colors.border.light,
    color: colors.text.primary,
  },
  warningContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.margin.sm,
  },
  warningText: {
    ...typography.textStyles.bodySmall,
    color: colors.error[600],
    marginTop: spacing.margin.sm,
    textAlign: 'left',
  },
  characterCount: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.margin.xs,
    textAlign: 'right',
  },
  evaluateButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.margin.md,
  },
  evaluateButtonDisabled: {
    opacity: 0.6,
  },
  evaluateButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.lg,
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.padding.lg,
    maxHeight: '80%',
    width: '92%',
  },
  cameraSection: {
    marginBottom: spacing.margin.sm,
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
  cameraHint: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  imagePreviewModalContent: {
    maxHeight: '90%',
  },
  imagePreviewTitle: {
    ...typography.textStyles.h4,
    color: colors.primary[600],
    textAlign: 'center',
    marginBottom: spacing.margin.md,
  },
  imageContainer: {
    marginBottom: spacing.margin.md,
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
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  evaluateImageButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  imagePreviewButtonText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    textAlign: 'center',
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

export default WritingUI;

