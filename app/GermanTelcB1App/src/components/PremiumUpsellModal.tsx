/**
 * Premium Upsell Modal
 * 
 * Modal that promotes premium features to users.
 * Uses shared PremiumContent component - same design as PremiumScreen.
 * Shows AlreadyPremiumView when user already has premium.
 */

import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import PremiumContent from './PremiumContent';
import AlreadyPremiumView from './AlreadyPremiumView';
import { usePremium } from '../contexts/PremiumContext';
import { ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PremiumUpsellModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchase: () => void;
  isPurchasing?: boolean;
  sourceScreen?: string; // Screen name for analytics tracking
}

const PremiumUpsellModal: React.FC<PremiumUpsellModalProps> = ({
  visible,
  onClose,
  onPurchase,
  isPurchasing = false,
  sourceScreen = 'unknown',
}) => {
  const { isPremium } = usePremium();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {isPremium ? (
            <AlreadyPremiumView 
              onClose={onClose}
              showCloseButton={true}
            />
          ) : (
            <PremiumContent
              onPurchase={onPurchase}
              onClose={onClose}
              isPurchasing={isPurchasing}
              showCloseButton={true}
              isModal={true}
              sourceScreen={sourceScreen}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#F0F9FF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: SCREEN_HEIGHT * 0.85,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
});

export default PremiumUpsellModal;
