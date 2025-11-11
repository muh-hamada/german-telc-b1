import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../theme';
import LinearGradient from 'react-native-linear-gradient';

interface HomeHeaderProps {
  // You can add props here if needed in the future
}

const HomeHeader: React.FC<HomeHeaderProps> = () => {
  const { t } = useTranslation();

  return (
    <LinearGradient
      colors={[colors.primary[800], colors.primary[600]]} // Adjust colors as needed
      start={{ x: 0, y: 1 }}
      end={{ x: 0, y: 0 }} // 10-degree angle
      style={styles.header}
    >
      <View style={styles.textContainer}>
        <Text style={styles.title}>{t('home.title')}</Text>
      </View>
      {/* <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Image
            source={require('../../assets/images/header-image.png')}
            style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
          />
        </View>
      </View> */}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    // backgroundColor: colors.primary[500],
    paddingTop: spacing.padding['2xl'],
    paddingBottom: spacing.padding.md,
    paddingHorizontal: spacing.padding.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    // minHeight: 80,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...typography.textStyles.h3,
    color: colors.white,
    fontSize: 24,
    textAlign: 'center',
    paddingHorizontal: spacing.padding.xl,
  },
  imageContainer: {
    flex: 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    width: '80%',
    aspectRatio: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  placeholderText: {
    ...typography.textStyles.body,
    color: colors.primary[500],
    fontSize: 12,
  },
});

export default HomeHeader;