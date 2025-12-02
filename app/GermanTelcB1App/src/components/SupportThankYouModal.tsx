import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SupportThankYouModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * SupportThankYouModal Component
 * 
 * Displays a beautiful thank you screen with hearts animation
 * after the user watches a support ad.
 */
const SupportThankYouModal: React.FC<SupportThankYouModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useCustomTranslation();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textScaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      textScaleAnim.setValue(0.5);

      // Run entrance animations
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(textScaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible, scaleAnim, fadeAnim, textScaleAnim, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Hearts GIF */}
          <Image
            source={require('../../assets/images/hearts.gif')}
            style={styles.heartsGif}
            resizeMode="cover"
          />

          {/* Thank You Text */}
          <Animated.View 
            style={[
              styles.textContainer,
              {
                transform: [{ scale: textScaleAnim }],
              },
            ]}
          >
            <Text style={styles.thankYouText}>
              {t('supportAd.thankYou')}
            </Text>
            <Text style={styles.appreciationText}>
              {t('supportAd.appreciation')}
            </Text>
          </Animated.View>

          {/* Tap to dismiss hint */}
          <Text style={styles.dismissHint}>
            {t('supportAd.tapToDismiss')}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.padding.xl,
  },
  heartsGif: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.5,
    marginBottom: spacing.margin['2xl'],
  },
  textContainer: {
    alignItems: 'center',
  },
  thankYouText: {
    fontSize: 42,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.margin.md,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appreciationText: {
    ...typography.textStyles.bodyLarge,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: spacing.padding.xl,
    lineHeight: 26,
  },
  dismissHint: {
    ...typography.textStyles.bodySmall,
    color: colors.white,
    opacity: 0.5,
    marginTop: spacing.margin.xl,
  },
});

export default SupportThankYouModal;

