import React, { useState, useEffect, useRef } from 'react';
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
  I18nManager,
  Image,
  Platform,
  PermissionsAndroid,
  Dimensions,
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import { WritingExam } from '../../types/exam.types';
import {
  evaluateWriting,
  evaluateWritingWithImage,
  getMockAssessment,
  isOpenAIConfigured,
} from '../../services/openai.service';
import { RewardedAd, RewardedAdEventType, TestIds, AdEventType } from 'react-native-google-mobile-ads';
import { SKIP_REWARDED_ADS } from '../../config/demo.config';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

interface WritingAssessment {
  overallScore: number;
  maxScore: number;
  userInput: string;
  criteria: {
    taskCompletion: {
      grade: 'A' | 'B' | 'C' | 'D';
      feedback: string;
    };
    communicativeDesign: {
      grade: 'A' | 'B' | 'C' | 'D';
      feedback: string;
    };
    formalCorrectness: {
      grade: 'A' | 'B' | 'C' | 'D';
      feedback: string;
    };
  };
  improvementTip: string;
}

interface WritingUIProps {
  exam: WritingExam;
  onComplete: (score: number) => void;
  isMockExam?: boolean; // Optional flag to indicate if this is part of a mock exam
}

// Ad Unit ID for rewarded ad
const REWARDED_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.select({
      ios: 'todo-ios-ad-unit-id', // Replace with iOS Ad Unit ID if different
      android: 'ca-app-pub-5101905792101482/1207745272',
    }) || TestIds.REWARDED;

const WritingUI: React.FC<WritingUIProps> = ({ exam, onComplete, isMockExam = false }) => {
  const { t } = useTranslation();
  const [userAnswer, setUserAnswer] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [assessment, setAssessment] = useState<WritingAssessment | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
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

  // Initialize and load rewarded ad
  useEffect(() => {
    const ad = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });

    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('Rewarded ad loaded');
      setIsAdLoaded(true);
    });

    const unsubscribeEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        console.log('User earned reward:', reward);
        logEvent(AnalyticsEvents.REWARDED_AD_EARNED_REWARD, { ad_unit_id: REWARDED_AD_UNIT_ID });
        // Proceed with evaluation after ad is watched
        const evaluationType = pendingEvaluationTypeRef.current;
        console.log('Pending evaluation type:', evaluationType);
        if (evaluationType === 'text') {
          proceedWithTextEvaluation();
        } else if (evaluationType === 'image') {
          proceedWithImageEvaluation();
        }
      }
    );

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Rewarded ad closed');
      logEvent(AnalyticsEvents.REWARDED_AD_CLOSED, { ad_unit_id: REWARDED_AD_UNIT_ID });
      // Reset pending evaluation
      setPendingEvaluationType(null);
      pendingEvaluationTypeRef.current = null;
      // Reload ad for next time
      setIsAdLoaded(false);
      ad.load();
    });

    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, error => {
      console.error('Rewarded ad error:', error);
      logEvent(AnalyticsEvents.REWARDED_AD_ERROR, { ad_unit_id: REWARDED_AD_UNIT_ID, error_code: String((error as any)?.code || 'unknown') });
      setIsAdLoaded(false);
      // Retry loading after a delay
      setTimeout(() => {
        ad.load();
      }, 5000);
    });

    // Load the ad
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

  const handleAnswerChange = (text: string) => {
    setUserAnswer(text);
    if (showWarning && text.trim().length >= 50) {
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
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        Alert.alert(t('writing.alerts.cameraError'), t('writing.alerts.cameraErrorMessage') + response.errorMessage);
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
          // Fallback if base64 is not available
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

    // Check if answer hasn't changed since last evaluation
    if (imageIdentifier === lastEvaluatedAnswer && assessment) {
      console.log('Image unchanged, showing cached assessment directly');
      setIsImagePreviewModalOpen(false);
      setIsUsingCachedResult(true);
      setIsResultsModalOpen(true);
      return;
    }

    // Show rewarded ad modal before evaluation
    setIsImagePreviewModalOpen(false);
    setPendingEvaluationType('image');
    pendingEvaluationTypeRef.current = 'image';

    if (SKIP_REWARDED_ADS) {
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

      if (isOpenAIConfigured()) {
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
      } else {
        console.log('OpenAI API key not configured. Using mock assessment.');
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
        result = getMockAssessment();
      }

      setLastEvaluatedAnswer(`[IMAGE:${imageUri}]`);
      setAssessment(result);
      setIsResultsModalOpen(true);
    } catch (error) {
      console.error('Evaluation error:', error);
      Alert.alert(
        t('writing.alerts.evaluationError'),
        error instanceof Error ? error.message : t('writing.alerts.evaluationErrorMessage'),
        [
          {
            text: t('writing.alerts.useMockData'),
            onPress: () => {
              const mockResult = getMockAssessment();
              setLastEvaluatedAnswer(`[IMAGE:${capturedImageUriRef.current}]`);
              setAssessment(mockResult);
              setIsUsingCachedResult(false); // This is not cached, it's a fresh mock evaluation
              setIsResultsModalOpen(true);
            },
          },
          { text: t('common.cancel'), style: 'cancel' },
        ]
      );
    } finally {
      setIsEvaluating(false);
      setPendingEvaluationType(null);
      pendingEvaluationTypeRef.current = null;
    }
  };

  const handleEvaluate = async () => {
    if (userAnswer.trim().length < 50) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);

    // Check if answer hasn't changed since last evaluation
    if (userAnswer === lastEvaluatedAnswer && assessment) {
      console.log('Answer unchanged, showing cached assessment directly');
      setIsUsingCachedResult(true);
      setIsResultsModalOpen(true);
      return;
    }

    // Show rewarded ad modal before evaluation
    setPendingEvaluationType('text');
    pendingEvaluationTypeRef.current = 'text';

    if (SKIP_REWARDED_ADS) {
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

      if (isOpenAIConfigured()) {
        result = await evaluateWriting({
          userAnswer: userAnswer,
          incomingEmail: exam.incomingEmail,
          writingPoints: exam.writingPoints,
          examTitle: exam.title,
        });
      } else {
        console.log('OpenAI API key not configured. Using mock assessment.');
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
        result = getMockAssessment();
      }

      setLastEvaluatedAnswer(userAnswer);
      setAssessment(result);
      setIsResultsModalOpen(true);
      logEvent(AnalyticsEvents.WRITING_EVAL_COMPLETED, { overall_score: result.overallScore, max_score: result.maxScore });
    } catch (error) {
      console.error('Evaluation error:', error);
      logEvent(AnalyticsEvents.WRITING_EVAL_FAILED, { error_code: error instanceof Error ? error.message : 'unknown' });
      Alert.alert(
        t('writing.alerts.evaluationError'),
        error instanceof Error ? error.message : t('writing.alerts.evaluationErrorMessage'),
        [
          {
            text: t('writing.alerts.useMockData'),
            onPress: () => {
              const mockResult = getMockAssessment();
              setLastEvaluatedAnswer(userAnswer);
              setAssessment(mockResult);
              setIsUsingCachedResult(false); // This is not cached, it's a fresh mock evaluation
              setIsResultsModalOpen(true);
            },
          },
          { text: t('common.cancel'), style: 'cancel' },
        ]
      );
    } finally {
      setIsEvaluating(false);
      setPendingEvaluationType(null);
    }
  };

  const handleWatchAdAndEvaluate = () => {
    if (!rewardedAd || !isAdLoaded) {
      Alert.alert(
        t('writing.rewardedAdModal.adNotReady'),
        '',
        [{ text: t('writing.alerts.ok') }]
      );
      return;
    }

    // Close the modal before showing the ad
    setShowRewardedAdModal(false);

    try {
      logEvent(AnalyticsEvents.REWARDED_AD_OPENED, { ad_unit_id: REWARDED_AD_UNIT_ID });
      rewardedAd.show();
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      logEvent(AnalyticsEvents.REWARDED_AD_ERROR, { ad_unit_id: REWARDED_AD_UNIT_ID, error_code: 'show_failed' });
      Alert.alert(
        t('writing.rewardedAdModal.adLoadingError'),
        '',
        [{ text: t('writing.alerts.ok') }]
      );
      // Reset state if ad fails to show
      setPendingEvaluationType(null);
      pendingEvaluationTypeRef.current = null;
    }
  };

  const handleMaybeLater = () => {
    setShowRewardedAdModal(false);
    setPendingEvaluationType(null);
    pendingEvaluationTypeRef.current = null;
    logEvent(AnalyticsEvents.REWARDED_AD_SKIPPED, { reason: 'user_cancelled' });
  };

  const handleSubmit = () => {
    if (!assessment) {
      Alert.alert(
        t('writing.alerts.noEvaluation'),
        t('writing.alerts.noEvaluationMessage'),
        [{ text: t('writing.alerts.ok') }]
      );
      return;
    }

    onComplete(assessment.overallScore);
  };

  const getGradeStyle = (grade: 'A' | 'B' | 'C' | 'D') => {
    switch (grade) {
      case 'A':
        return styles.criterionGreen;
      case 'B':
        return styles.criterionYellow;
      case 'C':
      case 'D':
        return styles.criterionRed;
      default:
        return styles.criterionYellow;
    }
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

    const isUsingMock = !isOpenAIConfigured();

    return (
      <Modal
        visible={isResultsModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsResultsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.resultsModalContent]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.resultsTitle}>
                {t('writing.evaluation.title')}
              </Text>

              {isUsingMock && (
                <View style={styles.mockWarning}>
                  <Text style={styles.mockWarningText}>
                    {t('writing.mock.warning')}
                  </Text>
                </View>
              )}

              {isUsingCachedResult && (
                <View style={styles.cacheInfo}>
                  <Text style={styles.cacheInfoText}>
                    {t('writing.mock.cacheInfo')}
                  </Text>
                </View>
              )}

              <View style={styles.scoreSection}>
                <Text style={styles.scoreLabel}>{t('writing.evaluation.totalScore')}</Text>
                <Text style={styles.scoreValue}>
                  {assessment.overallScore} / {assessment.maxScore}
                </Text>
              </View>

              <View style={styles.criteriaSection}>
                <Text style={styles.criteriaTitle}>{t('writing.evaluation.criteriaTitle')}</Text>

                <View style={[styles.criterionCard, getGradeStyle(assessment.criteria.taskCompletion.grade)]}>
                  <View style={styles.criterionHeader}>
                    <Text style={styles.criterionName}>{t('writing.evaluation.criteria.taskCompletion')}</Text>
                    <Text style={styles.criterionGrade}>{t('writing.evaluation.grade')} {assessment.criteria.taskCompletion.grade}</Text>
                  </View>
                  <Text style={styles.criterionFeedback}>{assessment.criteria.taskCompletion.feedback}</Text>
                </View>

                <View style={[styles.criterionCard, getGradeStyle(assessment.criteria.communicativeDesign.grade)]}>
                  <View style={styles.criterionHeader}>
                    <Text style={styles.criterionName}>{t('writing.evaluation.criteria.communicativeDesign')}</Text>
                    <Text style={styles.criterionGrade}>{t('writing.evaluation.grade')} {assessment.criteria.communicativeDesign.grade}</Text>
                  </View>
                  <Text style={styles.criterionFeedback}>{assessment.criteria.communicativeDesign.feedback}</Text>
                </View>

                <View style={[styles.criterionCard, getGradeStyle(assessment.criteria.formalCorrectness.grade)]}>
                  <View style={styles.criterionHeader}>
                    <Text style={styles.criterionName}>{t('writing.evaluation.criteria.formalCorrectness')}</Text>
                    <Text style={styles.criterionGrade}>{t('writing.evaluation.grade')} {assessment.criteria.formalCorrectness.grade}</Text>
                  </View>
                  <Text style={styles.criterionFeedback}>{assessment.criteria.formalCorrectness.feedback}</Text>
                </View>
              </View>

              <View style={styles.userInputSection}>
                <Text style={styles.userInputTitle}>{t('writing.evaluation.userInput')}</Text>
                <Text style={styles.userInputText}>{assessment.userInput || t('writing.evaluation.noUserInput')}</Text>
              </View>

              <View style={styles.improvementSection}>
                <Text style={styles.improvementTitle}>{t('writing.evaluation.improvementTip')}</Text>
                <Text style={styles.improvementText}>{assessment.improvementTip}</Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setIsResultsModalOpen(false)}
            >
              <Text style={styles.closeModalButtonText}>{t('writing.evaluation.closeButton')}</Text>
            </TouchableOpacity>
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

              <Text style={styles.imagePreviewSubtitle}>
                {t('writing.imagePreview.subtitle')}
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
                  <Text style={styles.imagePreviewButtonText}>{t('writing.imagePreview.retakeButton')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.imagePreviewButton, styles.evaluateImageButton]}
                  onPress={handleEvaluateImage}
                  disabled={isEvaluating}
                >
                  {isEvaluating ? (
                    <ActivityIndicator color={colors.background.secondary} />
                  ) : (
                    <Text style={styles.imagePreviewButtonText}>{t('writing.imagePreview.evaluateButton')}</Text>
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>{t('writing.instructions.title')}</Text>
        <Text style={styles.instructionsText}>
          {t('writing.instructions.description')}
        </Text>
      </View>

      {renderFullScreenLoading()}
      {renderRewardedAdModal()}

      {/* Incoming Email */}
      <View style={styles.emailSection}>
        <Text style={styles.sectionTitle}>{t('writing.sections.incomingEmail')}</Text>
        <View style={styles.emailCard}>
          <Text style={styles.emailText}>{exam.incomingEmail}</Text>
        </View>
      </View>

      {/* Writing Points */}
      <View style={styles.pointsSection}>
        <Text style={styles.sectionTitle}>{t('writing.sections.writingPoints')}</Text>
        {exam.writingPoints.map((point, index) => (
          <View key={index} style={styles.pointItem}>
            <Text style={styles.pointBullet}>•</Text>
            <Text style={styles.pointText}>{point}</Text>
          </View>
        ))}
      </View>

      {/* Answer Input */}
      <View style={styles.answerSection}>
        <Text style={styles.sectionTitle}>{t('writing.sections.yourAnswer')}</Text>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder={t('writing.input.placeholder')}
          value={userAnswer}
          onChangeText={handleAnswerChange}
          textAlignVertical="top"
        />
        {showWarning && (
          <Text style={styles.warningText}>
            {t('writing.input.minCharactersWarning')}
          </Text>
        )}
        <Text style={styles.characterCount}>
          {userAnswer.length} {t('writing.input.characterCount')}
        </Text>
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

      {/* Submit Button (only visible after evaluation and in mock exam mode) */}
      {assessment && isMockExam && (
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>{t('writing.buttons.nextSection')}</Text>
        </TouchableOpacity>
      )}

      {renderResultsModal()}
      {renderImagePreviewModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: colors.white,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
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
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
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
  },
  pointsSection: {
    marginBottom: spacing.margin.xl,
  },
  pointItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    marginBottom: spacing.margin.sm,
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
  warningText: {
    ...typography.textStyles.bodySmall,
    color: colors.error[600],
    marginTop: spacing.margin.sm,
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
    color: colors.background.secondary,
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
  },
  submitButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.lg,
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.padding.lg,
    maxHeight: '80%',
    width: '92%',
  },
  resultsModalContent: {
    maxHeight: '90%',
  },
  resultsTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[600],
    textAlign: 'center',
    marginBottom: spacing.margin.lg,
  },
  mockWarning: {
    backgroundColor: colors.warning[50],
    padding: spacing.padding.sm,
    borderRadius: spacing.borderRadius.sm,
    marginBottom: spacing.margin.md,
    borderWidth: 1,
    borderColor: colors.warning[500],
  },
  mockWarningText: {
    ...typography.textStyles.bodySmall,
    color: colors.warning[700],
    textAlign: 'center',
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
    marginBottom: spacing.margin.lg,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
  },
  scoreValue: {
    ...typography.textStyles.h2,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
  criteriaSection: {
  },
  criteriaTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
  },
  criterionCard: {
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    borderLeftWidth: 4,
  },
  criterionGreen: {
    backgroundColor: colors.success[50],
    borderLeftColor: colors.success[500],
  },
  criterionYellow: {
    backgroundColor: colors.warning[50],
    borderLeftColor: colors.warning[500],
  },
  criterionRed: {
    backgroundColor: colors.error[50],
    borderLeftColor: colors.error[500],
  },
  criterionHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.margin.sm,
  },
  criterionName: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  criterionGrade: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  criterionFeedback: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  userInputSection: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
  },
  userInputTitle: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  userInputText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  improvementSection: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
  },
  improvementTitle: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  improvementText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
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
    ...typography.textStyles.h3,
    color: colors.primary[600],
    textAlign: 'center',
    marginBottom: spacing.margin.sm,
  },
  imagePreviewSubtitle: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.margin.lg,
  },
  imageContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.padding.sm,
    marginBottom: spacing.margin.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: spacing.borderRadius.sm,
  },
  imagePreviewButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.margin.md,
    gap: spacing.margin.sm,
  },
  imagePreviewButton: {
    flex: 1,
    paddingVertical: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  retakeButton: {
    backgroundColor: colors.warning[500],
  },
  evaluateImageButton: {
    backgroundColor: colors.secondary[500],
  },
  imagePreviewButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.secondary,
  },
  cancelImageButton: {
    backgroundColor: colors.error[100],
    paddingVertical: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error[500],
  },
  cancelImageButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error[600],
  },
  rewardedAdModalContent: {
    padding: spacing.padding.xl,
  },
  rewardedAdModalTitle: {
    ...typography.textStyles.h3,
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

