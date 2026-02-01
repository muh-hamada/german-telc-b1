import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  Image,
  Platform,
  PermissionsAndroid,
  Dimensions,
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import { spacing, typography, type ThemeColors } from '../../theme';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useAppTheme } from '../../contexts/ThemeContext';
import { UserAnswer } from '../../types/exam.types';
import {
  evaluateWritingA1,
  evaluateWritingWithImageA1,
  WritingAssessmentA1,
} from '../../services/http.openai.service';
import { usePremium } from '../../contexts/PremiumContext';
import { useModalQueue } from '../../contexts/ModalQueueContext';
import { RewardedAd, RewardedAdEventType, TestIds, AdEventType } from 'react-native-google-mobile-ads';
import { SKIP_REWARDED_ADS } from '../../config/development.config';
import { activeExamConfig } from '../../config/active-exam.config';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import WritingResultsModalA1 from './WritingResultsModalA1';

// Ad Unit ID for rewarded ad
const REWARDED_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.select({
    ios: activeExamConfig.ads.rewarded.ios,
    android: activeExamConfig.ads.rewarded.android,
  }) || TestIds.REWARDED;

interface WritingPart2UIA1Props {
  exam: any;
  onComplete: (score: number, answers: UserAnswer[]) => void;
  isMockExam?: boolean;
}

const WritingPart2UIA1: React.FC<WritingPart2UIA1Props> = ({ exam, onComplete, isMockExam = false }) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const { isPremium } = usePremium();
  const { setContextualModalActive } = useModalQueue();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
  const examRef = useRef<any>(exam);

  // Update exam ref when exam prop changes
  useEffect(() => {
    examRef.current = exam;
  }, [exam]);

  // Initialize and load rewarded ad
  useEffect(() => {
    const ad = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });

    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('[WritingPart2UIA1] ✅ Rewarded ad loaded successfully');
      setIsAdLoaded(true);
    });

    const unsubscribeEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        console.log('[WritingPart2UIA1] 🎁 User earned reward:', reward);
        adEarnedRewardRef.current = true;
        logEvent(AnalyticsEvents.REWARDED_AD_EARNED_REWARD, { ad_unit_id: REWARDED_AD_UNIT_ID });
        console.log('[WritingPart2UIA1] 💾 Reward earned, waiting for ad to close before starting evaluation');
      }
    );

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('[WritingPart2UIA1] ❌ Rewarded ad closed', {
        earnedReward: adEarnedRewardRef.current,
        pendingEvaluationType: pendingEvaluationTypeRef.current
      });
      logEvent(AnalyticsEvents.REWARDED_AD_CLOSED, { ad_unit_id: REWARDED_AD_UNIT_ID });

      if (!adEarnedRewardRef.current) {
        console.log('[WritingPart2UIA1] ⚠️ Ad closed without earning reward - resetting state');
        setPendingEvaluationType(null);
        pendingEvaluationTypeRef.current = null;
        setShowRewardedAdModal(false);
        setIsEvaluating(false);
      } else {
        console.log('[WritingPart2UIA1] ✅ Ad closed after earning reward - starting evaluation NOW');
        setShowRewardedAdModal(false);

        const evaluationType = pendingEvaluationTypeRef.current;
        console.log('[WritingPart2UIA1] 📝 Starting evaluation type:', evaluationType);
        if (evaluationType === 'text') {
          proceedWithTextEvaluation();
        } else if (evaluationType === 'image') {
          proceedWithImageEvaluation();
        }
      }

      const hadEarnedReward = adEarnedRewardRef.current;
      adEarnedRewardRef.current = false;

      setIsAdLoaded(false);
      console.log('[WritingPart2UIA1] 🔄 Reloading ad for next time');
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

      console.log('[WritingPart2UIA1] 🧹 Error cleanup - resetting all states');
      setIsAdLoaded(false);
      setShowRewardedAdModal(false);
      setIsEvaluating(false);
      setPendingEvaluationType(null);
      pendingEvaluationTypeRef.current = null;
      adEarnedRewardRef.current = false;

      setTimeout(() => {
        console.log('[WritingPart2UIA1] 🔄 Retrying ad load after error');
        ad.load();
      }, 5000);
    });

    console.log('[WritingPart2UIA1] 📱 Initializing rewarded ad');
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

  const handleTextChange = (text: string) => {
    setUserText(text);
    userTextRef.current = text;
  };

  const getWordCount = () => {
    return userText.trim().split(/\s+/).filter(word => word.length > 0).length;
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
        console.log('[WritingPart2UIA1] User cancelled camera');
      } else if (response.errorCode) {
        Alert.alert(t('writing.alerts.cameraError'), t('writing.alerts.cameraErrorMessage'));
        console.error('[WritingPart2UIA1] Camera error:', response);
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
      console.log('[WritingPart2UIA1] Image unchanged, showing cached assessment directly');
      setIsImagePreviewModalOpen(false);
      setIsUsingCachedResult(true);
      if (!isMockExam) {
        // If not a mock exam, show the results modal
        // In the mock exam, the results is shown at the end of the exam
        setShowResultsModal(true);
      }
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
    const currentExam = examRef.current;
    if (!currentExam) {
      console.error('[WritingPart2UIA1] No exam data available for evaluation');
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
          examTitle: currentExam.title,
          instructionHeader: currentExam.instruction_header,
          taskPoints: currentExam.task_points || [],
          imageUri: '',
        });
      } else if (imageUri) {
        result = await evaluateWritingWithImageA1({
          imageUri: imageUri,
          examTitle: currentExam.title,
          instructionHeader: currentExam.instruction_header,
          taskPoints: currentExam.task_points || [],
          imageBase64: '',
        });
      } else {
        throw new Error('No image available');
      }

      setLastEvaluatedAnswer(`[IMAGE:${imageUri}]`);
      setAssessment(result);

      if (!isMockExam) {
        // If not a mock exam, show the results modal
        // In the mock exam, the results is shown at the end of the exam
        setShowResultsModal(true);
      }
      logEvent(AnalyticsEvents.WRITING_EVAL_COMPLETED, { overall_score: result.overallScore, max_score: result.maxScore });

      const answers: UserAnswer[] = [{
        questionId: 1,
        answer: '[IMAGE]',
        isCorrect: result.overallScore >= 6,
        timestamp: Date.now(),
        correctAnswer: '',
        assessment: result, // Store the assessment for viewing later in mock exam results
      }];

      onComplete(result.overallScore, answers);
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
      console.log('[WritingPart2UIA1] Answer unchanged, showing cached assessment directly');
      setIsUsingCachedResult(true);
      if (!isMockExam) {
        // If not a mock exam, show the results modal
        // In the mock exam, the results is shown at the end of the exam
        setShowResultsModal(true);
      }
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
    console.log('[WritingPart2UIA1] proceedWithTextEvaluation called');
    const currentExam = examRef.current;
    if (!currentExam) {
      console.error('[WritingPart2UIA1] No exam data available for evaluation');
      return;
    }

    setIsEvaluating(true);
    setIsUsingCachedResult(false);

    try {
      const answerToEvaluate = userTextRef.current;
      console.log('[WritingPart2UIA1] Evaluating text:', answerToEvaluate.substring(0, 50) + '...');

      const result = await evaluateWritingA1({
        userAnswer: answerToEvaluate,
        examTitle: currentExam.title,
        instructionHeader: currentExam.instruction_header,
        taskPoints: currentExam.task_points || [],
        imageBase64: '',
      });

      setLastEvaluatedAnswer(answerToEvaluate);
      setAssessment(result);

      if (!isMockExam) {
        // If not a mock exam, show the results modal
        // In the mock exam, the results is shown at the end of the exam
        setShowResultsModal(true);
      }
      logEvent(AnalyticsEvents.WRITING_EVAL_COMPLETED, { overall_score: result.overallScore, max_score: result.maxScore });

      const answers: UserAnswer[] = [{
        questionId: 1,
        answer: answerToEvaluate,
        isCorrect: result.overallScore >= 6,
        timestamp: Date.now(),
        correctAnswer: '',
        assessment: result, // Store the assessment for viewing later in mock exam results
      }];

      onComplete(result.overallScore, answers);
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
    console.log('[WritingPart2UIA1] handleWatchAdAndEvaluate called', {
      hasAd: !!rewardedAd,
      isAdLoaded,
      pendingEvaluationType
    });

    if (!rewardedAd || !isAdLoaded) {
      console.log('[WritingPart2UIA1] Ad not ready, showing alert');
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

    console.log('[WritingPart2UIA1] Preparing to show rewarded ad...');
    logEvent(AnalyticsEvents.REWARDED_AD_OPENED, { ad_unit_id: REWARDED_AD_UNIT_ID });
    adEarnedRewardRef.current = false;

    setShowRewardedAdModal(false);

    setTimeout(() => {
      console.log('[WritingPart2UIA1] Calling rewardedAd.show()');
      try {
        rewardedAd.show();
      } catch (showError) {
        console.error('[WritingPart2UIA1] Error calling show():', showError);
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

  const handleEvaluateText = async () => {
    await handleEvaluate();
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

  return (
    <View style={styles.container}>
      {renderFullScreenLoading()}
      {renderRewardedAdModal()}

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={styles.examTitle}>{exam.title}</Text>

        {/* Instructions */}
        {exam.instruction_header && (
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>{t('writing.instructions.title')}</Text>
            <Text style={styles.instructionText}>{exam.instruction_header}</Text>
          </View>
        )}

        {/* Task Points */}
        {exam.task_points && exam.task_points.length > 0 && (
          <View style={styles.taskPointsCard}>
            <Text style={styles.taskPointsTitle}>{t('practice.writing.taskPoints')}</Text>
            {exam.task_points.map((point: any, index: number) => (
              <View key={point.id || index} style={styles.taskPointRow}>
                <View style={styles.taskPointNumber}>
                  <Text style={styles.taskPointNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.taskPointText}>{point.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Task */}
        {exam.task && (
          <View style={styles.taskCard}>
            <Text style={styles.taskTitle}>{t('writing.sections.writingPoints')}</Text>
            <Text style={styles.taskText}>{exam.task}</Text>
          </View>
        )}

        {/* Constraints/Hints */}
        {exam.constraints && (
          <View style={styles.hintsCard}>
            {exam.constraints.text_length_hint && (
              <Text style={styles.hintText}>💡 {exam.constraints.text_length_hint}</Text>
            )}
            {exam.constraints.structure_hint && (
              <Text style={styles.hintText}>💡 {exam.constraints.structure_hint}</Text>
            )}
          </View>
        )}

        {/* Writing Area */}
        <View style={styles.writingSection}>
          <Text style={styles.sectionTitle}>{t('writing.sections.yourAnswer')}</Text>
          <TextInput
            style={styles.textInput}
            value={userText}
            onChangeText={handleTextChange}
            placeholder={t('writing.input.placeholder')}
            placeholderTextColor={colors.text.secondary}
            multiline
            textAlignVertical="top"
            editable={!assessment}
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

        {/* Camera Section */}
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
          style={[styles.submitButton, isEvaluating && styles.submitButtonDisabled]}
          onPress={handleEvaluateText}
          disabled={isEvaluating}
        >
          <Text style={styles.submitButtonText}>
            {t('writing.buttons.evaluate')}
          </Text>
        </TouchableOpacity>

      </ScrollView>

      <WritingResultsModalA1
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        assessment={assessment}
        isUsingCachedResult={isUsingCachedResult}
        lastEvaluatedAnswer={lastEvaluatedAnswer}
        modalAnswer={exam?.modalAnswer}
      />
      {renderImagePreviewModal()}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    padding: spacing.padding.lg,
    paddingBottom: spacing.padding.xl * 2,
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
  instructionTitle: {
    ...typography.textStyles.bodySmall,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
  },
  instructionText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
    textAlign: 'left',
  },
  taskCard: {
    backgroundColor: colors.secondary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
  },
  taskTitle: {
    ...typography.textStyles.bodySmall,
    color: colors.secondary[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
  },
  taskText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
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
    flex: 1,
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
  writingSection: {
    marginBottom: spacing.margin.lg,
  },
  sectionTitle: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
    textAlign: 'left',
  },
  textInput: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.padding.md,
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
    marginBottom: spacing.margin.md,
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
  submitButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.textStyles.body,
    color: colors.background.secondary,
    fontWeight: typography.fontWeight.bold,
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
  evaluateButtonText: {
    color: colors.text.primary,
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

export default WritingPart2UIA1;

