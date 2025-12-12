/**
 * Premium Upsell Modal
 * 
 * Modal that promotes premium features to users.
 * Uses shared PremiumContent component - same design as PremiumScreen.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import PremiumContent from './PremiumContent';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PremiumUpsellModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchase: () => void;
  isPurchasing?: boolean;
}

const PremiumUpsellModal: React.FC<PremiumUpsellModalProps> = ({
  visible,
  onClose,
  onPurchase,
  isPurchasing = false,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <PremiumContent
            onPurchase={onPurchase}
            onClose={onClose}
            isPurchasing={isPurchasing}
            showCloseButton={true}
            isModal={true}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
