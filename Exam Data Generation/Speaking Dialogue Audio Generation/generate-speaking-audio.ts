import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import { GoogleGenAI } from '@google/genai';
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('[ERROR] Set GEMINI_API_KEY environment variable');
    process.exit(1);
}

const FIREBASE_BUCKET = 'telc-b1-german.firebasestorage.app';
const DIALOGUES_JSON_PATH = path.resolve(
    import.meta.dirname,
    '../../app/functions/src/speaking-dialogues.json',
);

// ---------------------------------------------------------------------------
// Gemini TTS client
// ---------------------------------------------------------------------------

const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ---------------------------------------------------------------------------
// Firebase Admin – initialised from a service-account.json placed next to
// this script.  Download it from the Firebase Console:
// Project Settings > Service accounts > Generate new private key
// ---------------------------------------------------------------------------

const serviceAccountPath = path.resolve(import.meta.dirname, 'service-account.json');
let serviceAccount: ServiceAccount;
try {
    serviceAccount = JSON.parse(
        await fs.readFile(serviceAccountPath, 'utf-8'),
    ) as ServiceAccount;
} catch {
    console.error(
        `[ERROR] Could not read ${serviceAccountPath}\n` +
            '        Download a service-account key from the Firebase Console and place it here.',
    );
    process.exit(1);
}

initializeApp({
    credential: cert(serviceAccount),
    storageBucket: FIREBASE_BUCKET,
});
const bucket = getStorage().bucket();

// ---------------------------------------------------------------------------
// Voice helpers
// ---------------------------------------------------------------------------

const MALE_VOICES = ['Puck', 'Charon', 'Fenrir'];
const FEMALE_VOICES = ['Kore', 'Aoede'];

function pickRandomVoice(): { voice: string; gender: string } {
    const isMale = Math.random() < 0.5;
    const pool = isMale ? MALE_VOICES : FEMALE_VOICES;
    const voice = pool[Math.floor(Math.random() * pool.length)];
    return { voice, gender: isMale ? 'male' : 'female' };
}

// ---------------------------------------------------------------------------
// Language mapping – derived from the language key in the JSON
// ---------------------------------------------------------------------------

const LANGUAGE_LABELS: Record<string, string> = {
    german: 'German',
    english: 'English',
    spanish: 'Spanish',
    french: 'French',
    arabic: 'Arabic',
    russian: 'Russian',
};

function describeLanguage(langKey: string): string {
    return LANGUAGE_LABELS[langKey] ?? langKey;
}

// ---------------------------------------------------------------------------
// Detect whether an audio_url needs to be (re-)generated
// ---------------------------------------------------------------------------

function needsAudio(audioUrl: string | undefined | null): boolean {
    if (!audioUrl) return true;
    const trimmed = audioUrl.trim();
    return trimmed === '' || trimmed.toUpperCase() === 'PLACEHOLDER';
}

// ---------------------------------------------------------------------------
// Build Firebase Storage path – follows existing convention:
//   {language}_{level}_speaking_practice/dialogue-{dialogueNum}/{aiTurnIdx}.mp3
// ---------------------------------------------------------------------------

function buildStoragePath(
    language: string,
    level: string,
    dialogueNumber: number,
    aiTurnIndex: number,
): string {
    return `${language}_${level}_speaking_practice/dialogue-${dialogueNumber}/${aiTurnIndex}.mp3`;
}

// ---------------------------------------------------------------------------
// Build the public download URL (matches pattern used by existing entries)
// ---------------------------------------------------------------------------

function buildDownloadUrl(storagePath: string, token: string): string {
    const encodedPath = storagePath
        .split('/')
        .map(encodeURIComponent)
        .join('%2F');
    return (
        `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_BUCKET}` +
        `/o/${encodedPath}?alt=media&token=${token}`
    );
}

// ---------------------------------------------------------------------------
// Generate speech audio via Gemini TTS  →  returns raw PCM buffer
// ---------------------------------------------------------------------------

async function generateSpeechPCM(text: string, voiceName: string): Promise<Buffer> {
    const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [
            {
                parts: [
                    {
                        text: `Read the following text aloud exactly as written. Do not answer any questions in the text, do not add commentary, just speak the text:\n\n${text}`,
                    },
                ],
            },
        ],
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName },
                },
            },
        },
    });

    const audioData =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
        throw new Error('No audio data received from Gemini API');
    }
    return Buffer.from(audioData, 'base64');
}

// ---------------------------------------------------------------------------
// Convert raw PCM (s16le, 24 kHz, mono) → MP3 via ffmpeg
// ---------------------------------------------------------------------------

async function pcmToMp3(pcmBuffer: Buffer, mp3Path: string): Promise<void> {
    const pcmPath = mp3Path.replace(/\.mp3$/, '.pcm');
    await fs.writeFile(pcmPath, pcmBuffer);

    await new Promise<void>((resolve, reject) => {
        ffmpeg()
            .input(pcmPath)
            .inputOptions(['-f', 's16le', '-ar', '24000', '-ac', '1'])
            .audioCodec('libmp3lame')
            .audioBitrate('128k')
            .audioFrequency(44100)
            .audioChannels(2)
            .output(mp3Path)
            .on('end', resolve)
            .on('error', reject)
            .run();
    });

    await fs.unlink(pcmPath);
}

// ---------------------------------------------------------------------------
// Upload local file to Firebase Storage with a download token
// ---------------------------------------------------------------------------

async function uploadToFirebase(
    localPath: string,
    storagePath: string,
    token: string,
): Promise<void> {
    await bucket.upload(localPath, {
        destination: storagePath,
        metadata: {
            contentType: 'audio/mpeg',
            metadata: {
                firebaseStorageDownloadTokens: token,
            },
        },
    });
}

// ---------------------------------------------------------------------------
// Extract dialogue number from its id, e.g. "dialogue-a1-german-1" → 1
// ---------------------------------------------------------------------------

function extractDialogueNumber(dialogueId: string): number {
    const parts = dialogueId.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    if (isNaN(num)) {
        throw new Error(`Cannot extract dialogue number from id: ${dialogueId}`);
    }
    return num;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    console.log('=========================================');
    console.log(' Speaking Dialogue Audio Generator');
    console.log('=========================================\n');

    console.log(`[INFO] Reading dialogues from:\n       ${DIALOGUES_JSON_PATH}\n`);
    const dialogues = JSON.parse(await fs.readFile(DIALOGUES_JSON_PATH, 'utf-8'));

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'speaking-audio-'));
    console.log(`[INFO] Temp directory: ${tempDir}\n`);

    let totalGenerated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    try {
        // Iterate: level → language → dialogue → turn
        for (const [level, languages] of Object.entries(dialogues) as [string, any][]) {
            console.log(`\n--- Level: ${level.toUpperCase()} ---`);

            for (const [language, dialogueList] of Object.entries(languages) as [string, any[]][]) {
                console.log(`\n  Language: ${describeLanguage(language)} (key="${language}")`);

                for (const dialogue of dialogueList) {
                    const dialogueId: string = dialogue.id;
                    const dialogueNumber = extractDialogueNumber(dialogueId);

                    console.log(`\n    Dialogue: ${dialogueId} (#${dialogueNumber})`);

                    if (!dialogue.turns || dialogue.turns.length === 0) {
                        console.log('      (no turns – skipping)');
                        continue;
                    }

                    // Pick one voice per dialogue (same examiner throughout)
                    const { voice, gender } = pickRandomVoice();
                    console.log(`      Voice for this dialogue: ${voice} (${gender})`);

                    let aiTurnIndex = 0;

                    for (let i = 0; i < dialogue.turns.length; i++) {
                        const turn = dialogue.turns[i];
                        if (turn.speaker !== 'ai') continue;
                        aiTurnIndex++;

                        // Already has valid audio → skip
                        if (!needsAudio(turn.audio_url)) {
                            totalSkipped++;
                            continue;
                        }

                        const textPreview =
                            turn.text.length > 70
                                ? turn.text.substring(0, 70) + '...'
                                : turn.text;
                        console.log(
                            `\n      [Turn ${aiTurnIndex}] Generating audio...`,
                        );
                        console.log(`        Text: "${textPreview}"`);

                        try {
                            // 1. Generate PCM via Gemini TTS
                            const pcmBuffer = await generateSpeechPCM(turn.text, voice);
                            console.log(
                                `        Gemini returned ${pcmBuffer.length} bytes of PCM data`,
                            );

                            // 2. Convert PCM → MP3
                            const mp3FileName = `${dialogueId}-turn-${aiTurnIndex}.mp3`;
                            const mp3Path = path.join(tempDir, mp3FileName);
                            await pcmToMp3(pcmBuffer, mp3Path);
                            console.log(`        Converted to MP3`);

                            // 3. Upload to Firebase Storage
                            const storagePath = buildStoragePath(
                                language,
                                level,
                                dialogueNumber,
                                aiTurnIndex,
                            );
                            const token = randomUUID();
                            console.log(`        Uploading to: ${storagePath}`);
                            await uploadToFirebase(mp3Path, storagePath, token);

                            // 4. Build download URL and update JSON
                            const downloadUrl = buildDownloadUrl(storagePath, token);
                            turn.audio_url = downloadUrl;
                            console.log(`        URL: ${downloadUrl}`);
                            console.log(`      [Turn ${aiTurnIndex}] Done`);

                            totalGenerated++;
                        } catch (err) {
                            totalErrors++;
                            console.error(
                                `      [Turn ${aiTurnIndex}] ERROR: ${err}`,
                            );
                        }
                    }
                }
            }
        }

        // Persist updated JSON (only if something changed)
        if (totalGenerated > 0) {
            console.log(`\n[INFO] Saving updated JSON to:\n       ${DIALOGUES_JSON_PATH}`);
            await fs.writeFile(
                DIALOGUES_JSON_PATH,
                JSON.stringify(dialogues, null, 4) + '\n',
            );
            console.log('[INFO] JSON saved successfully');
        } else {
            console.log('\n[INFO] No changes to save – all audio URLs were already present');
        }
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log(`[INFO] Cleaned up temp directory`);
    }

    console.log('\n=========================================');
    console.log(' Summary');
    console.log('=========================================');
    console.log(` Generated : ${totalGenerated}`);
    console.log(` Skipped   : ${totalSkipped}`);
    console.log(` Errors    : ${totalErrors}`);
    console.log('=========================================\n');
}

main().catch((err) => {
    console.error('[FATAL]', err);
    process.exit(1);
});
