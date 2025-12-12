async function downloadAudio(messageId, conversationId, voiceType = 'alloy', audioFormat = 'aac') {
    let accessToken = null;

    try {
        const response = await fetch("https://chatgpt.com/api/auth/session");
        if (!response.ok) {
            throw new Error(`Failed to get auth token: ${response.status}`);
        }
        const data = await response.json();
        if (!data || !data.accessToken) {
            throw new Error("Access token not found in session response.");
        }
        accessToken = data.accessToken;
    } catch (error) {
        console.error("Auth token fetch error:", error);
        throw new Error(`Authentication failed: ${error.message}`);
    }

    if (!accessToken) {
        throw new Error("Access token not found.");
    }

    const response = await fetch(
        `https://chatgpt.com/backend-api/synthesize?message_id=${messageId}&conversation_id=${conversationId}&voice=${voiceType}&format=${audioFormat}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: `audio/${audioFormat},*/*;q=0.9`
            }
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `message-${messageId}.${audioFormat}`;
    a.click();

    URL.revokeObjectURL(url);
}
