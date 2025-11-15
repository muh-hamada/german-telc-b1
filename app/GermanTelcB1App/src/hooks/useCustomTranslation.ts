import { useTranslation, UseTranslationResponse } from 'react-i18next';
import { Platform } from 'react-native';

/**
 * Custom hook that wraps react-i18next's useTranslation
 * Automatically removes "Telc" from all translated strings on iOS
 */
export function useCustomTranslation(): UseTranslationResponse<'translation', undefined> {
    const translation = useTranslation();

    // Only apply transformation on iOS
    if (Platform.OS !== 'ios') {
        return translation;
    }

    // Wrap the t function to apply text transformation
    const originalT = translation.t;

    const customT = ((...args: Parameters<typeof originalT>) => {
        const result = originalT(...args);

        // Only process strings, not objects or arrays
        if (typeof result === 'string') {
            return removeTelcFromText(result);
        }

        return result;
    }) as typeof originalT;

    return {
        ...translation,
        t: customT,
    };
}

/**
 * Removes "Telc" (case-insensitive) from text and cleans up extra spaces
 */
export function removeTelcFromText(text: string): string {
    // In german for example, the text contains "-" like Telc-Prüfung, so we need to remove the "-"
    // We only need to remove the "-" after "telc". Keep all other "-"
    const telcWithDash = text.match(/telc-.*?/ig);

    let textToReplace = "telc";
    if (telcWithDash) {
        textToReplace = "telc-";
    }
    const withoutTelc = text.replace(new RegExp(textToReplace, 'ig'), '');
    return withoutTelc.replace(/\s{2,}/g, ' ').trim();
}