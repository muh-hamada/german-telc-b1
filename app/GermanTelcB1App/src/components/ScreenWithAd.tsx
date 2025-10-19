import React from 'react';
import { View, StyleSheet } from 'react-native';
import AdBanner from './AdBanner';

interface ScreenWithAdProps {
  children: React.ReactNode;
}

/**
 * ScreenWithAd Component
 * Wraps screen content and adds a banner ad at the bottom
 */
const ScreenWithAd: React.FC<ScreenWithAdProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
      <AdBanner />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default ScreenWithAd;

