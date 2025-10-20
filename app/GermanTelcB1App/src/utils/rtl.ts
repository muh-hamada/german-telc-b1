import { I18nManager } from 'react-native';
import { FlexAlignType } from 'react-native';
import i18n from './i18n';

/**
 * Check if the current language requires RTL
 * Uses the current i18n language instead of I18nManager for dynamic detection
 */
export const isRTL = (): boolean => {
  const currentLang = i18n.language;
  return currentLang === 'ar'; // Only Arabic needs RTL
};

/**
 * Check if I18nManager is in RTL mode (static, requires restart to change)
 */
export const isRTLLayout = (): boolean => {
  return I18nManager.isRTL;
};

/**
 * Get the appropriate flexDirection based on RTL mode
 * @param direction - The desired direction ('row' or 'row-reverse')
 */
export const getFlexDirection = (
  direction: 'row' | 'row-reverse' | 'column' | 'column-reverse'
): 'row' | 'row-reverse' | 'column' | 'column-reverse' => {
  if (direction === 'row' && isRTL()) {
    return 'row-reverse';
  }
  if (direction === 'row-reverse' && isRTL()) {
    return 'row';
  }
  return direction;
};

/**
 * Get text alignment based on RTL mode
 * @param align - Default alignment for LTR
 */
export const getTextAlign = (align: 'left' | 'right' | 'center' = 'left'): 'left' | 'right' | 'center' => {
  if (align === 'center') return 'center';
  if (isRTL()) {
    return align === 'left' ? 'right' : 'left';
  }
  return align;
};

/**
 * Helper to get start/end directional values
 */
export const getDirectionalValue = <T,>(ltrValue: T, rtlValue: T): T => {
  return isRTL() ? rtlValue : ltrValue;
};

/**
 * Style helper for margin start (left in LTR, right in RTL)
 */
export const marginStart = (value: number) => {
  return isRTL() ? { marginRight: value } : { marginLeft: value };
};

/**
 * Style helper for margin end (right in LTR, left in RTL)
 */
export const marginEnd = (value: number) => {
  return isRTL() ? { marginLeft: value } : { marginRight: value };
};

/**
 * Style helper for padding start (left in LTR, right in RTL)
 */
export const paddingStart = (value: number) => {
  return isRTL() ? { paddingRight: value } : { paddingLeft: value };
};

/**
 * Style helper for padding end (right in LTR, left in RTL)
 */
export const paddingEnd = (value: number) => {
  return isRTL() ? { paddingLeft: value } : { paddingRight: value };
};

/**
 * Style helper for border start (left in LTR, right in RTL)
 */
export const borderStartWidth = (value: number) => {
  return isRTL() ? { borderRightWidth: value } : { borderLeftWidth: value };
};

/**
 * Style helper for border end (right in LTR, left in RTL)
 */
export const borderEndWidth = (value: number) => {
  return isRTL() ? { borderLeftWidth: value } : { borderRightWidth: value };
};

/**
 * Style helper for border start color
 */
export const borderStartColor = (color: string) => {
  return isRTL() ? { borderRightColor: color } : { borderLeftColor: color };
};

/**
 * Style helper for border end color
 */
export const borderEndColor = (color: string) => {
  return isRTL() ? { borderLeftColor: color } : { borderRightColor: color };
};

/**
 * Get alignment for flex items
 */
export const getAlignItems = (align: FlexAlignType): FlexAlignType => {
  if (align === 'flex-start' && isRTL()) return 'flex-end';
  if (align === 'flex-end' && isRTL()) return 'flex-start';
  return align;
};

/**
 * Transform value for RTL (useful for icons, images, etc.)
 */
export const transformRTL = () => {
  return isRTL() ? [{ scaleX: -1 }] : [];
};

