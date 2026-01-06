import { useTranslation, UseTranslationResponse } from 'react-i18next';
import { Platform } from 'react-native';
import { useRemoteConfig } from '../contexts/RemoteConfigContext';

/**
 * Custom hook that wraps react-i18next's useTranslation
 * Automatically removes "Telc" from all translated strings on iOS if enabled via remote config
 */
export function useCustomTranslation(): UseTranslationResponse<'translation', undefined> {
    const translation = useTranslation();
    const { globalConfig } = useRemoteConfig();

    // Check if we should remove telc text on iOS (controlled by remote config)
    const shouldRemoveTelc = Platform.OS === 'ios' && (globalConfig?.removeTelcFromText_iOS ?? true);

    // Only apply transformation if enabled
    if (!shouldRemoveTelc) {
        return translation;
    }

    // Wrap the t function to apply text transformation
    const originalT = translation.t;

    const customT = ((...args: Parameters<typeof originalT>) => {
        // search for "cleanText" in args
        // we use that in the disclaimer screen to keep the original text with "telc" in it
        let shouldCleanText = true;
        args.forEach((arg) => {
            if (typeof arg === 'object' && arg !== null && 'cleanText' in arg) {
                shouldCleanText = arg.cleanText as boolean;
                return;
            }
        });

        const result = originalT(...args);

        // Only process strings, not objects or arrays
        if (typeof result === 'string') {
            if (shouldCleanText) {
                return removeTelcFromText(result);
            }
            return result;
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
    const result_1 =  withoutTelc.replace(/\s{2,}/g, ' ').trim();

    // some text may include "telc-" and "telc" together, so we need to remove the "telc" as well
    const withoutTelcAndDash = result_1.replace(new RegExp("telc", 'ig'), '');
    const result_2 = withoutTelcAndDash.replace(/\s{2,}/g, ' ').trim();

    return result_2;
}