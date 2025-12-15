import React, { useEffect, useRef, useMemo } from 'react';
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
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';

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
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const containerScaleAnim = useRef(new Animated.Value(0.8)).current;
  const containerFadeAnim = useRef(new Animated.Value(0)).current;
  const textScaleAnim = useRef(new Animated.Value(0.9)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const hintFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      containerScaleAnim.setValue(0.8);
      containerFadeAnim.setValue(0);
      textScaleAnim.setValue(0.9);
      textFadeAnim.setValue(0);
      hintFadeAnim.setValue(0);

      // Run all animations in parallel with staggered timing for smooth effect
      Animated.parallel([
        // Container fade and scale
        Animated.timing(containerFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(containerScaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        // Text animations with slight delay
        Animated.sequence([
          Animated.delay(150),
          Animated.parallel([
            Animated.timing(textFadeAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(textScaleAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Hint fade in last
        Animated.sequence([
          Animated.delay(500),
          Animated.timing(hintFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible, containerScaleAnim, containerFadeAnim, textScaleAnim, textFadeAnim, hintFadeAnim, onClose]);

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
              opacity: containerFadeAnim,
              transform: [{ scale: containerScaleAnim }],
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
                opacity: textFadeAnim,
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
          <Animated.Text style={[styles.dismissHint, { opacity: hintFadeAnim }]}>
            {t('supportAd.tapToDismiss')}
          </Animated.Text>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
      color: colors.text.secondary,
      opacity: 0.5,
      marginTop: spacing.margin.xl,
    },
  });

export default SupportThankYouModal;

