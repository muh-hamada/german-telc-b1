/**
 * AnimatedGradientBorder Component
 * 
 * Creates an animated rotating gradient border effect similar to the web version.
 * Uses react-native-linear-gradient with Animated API for smooth performance.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface AnimatedGradientBorderProps {
  children: React.ReactNode;
  borderWidth?: number;
  borderRadius?: number;
  colors?: string[];
  style?: ViewStyle;
  duration?: number;
}

const AnimatedGradientBorder: React.FC<AnimatedGradientBorderProps> = ({
  children,
  borderWidth = 2,
  borderRadius = 12,
  colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#667eea'],
  style,
  duration = 3000,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create infinite rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      })
    ).start();
  }, [duration]);

  // Interpolate rotation value to degrees
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, style, { borderRadius: borderRadius + borderWidth, overflow: 'hidden' }]}>
      {/* Wrapper to contain rotation */}
      <View style={styles.rotationWrapper}>
        {/* Rotating gradient border - larger to cover corners during rotation */}
        <Animated.View
          style={[
            styles.gradientContainer,
            {
              transform: [{ rotate }],
            },
          ]}
        >
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          />
        </Animated.View>

        {/* Glow effect layer (optional blur effect) */}
        <Animated.View
          style={[
            styles.glowContainer,
            {
              transform: [{ rotate }],
            },
          ]}
        >
          <LinearGradient
            colors={colors.map(color => `${color}80`)} // Add transparency for glow
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glow}
          />
        </Animated.View>
      </View>

      {/* Inner content container */}
      <View
        style={[
          styles.innerContainer,
          {
            borderRadius,
            margin: borderWidth,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  rotationWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradientContainer: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    zIndex: 1,
  },
  gradient: {
    flex: 1,
  },
  glowContainer: {
    position: 'absolute',
    top: -54,
    left: -54,
    right: -54,
    bottom: -54,
    zIndex: 0,
    opacity: 0.5,
  },
  glow: {
    flex: 1,
  },
  innerContainer: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    zIndex: 2,
  },
});

export default AnimatedGradientBorder;

