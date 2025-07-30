
const apiUrl =  import.meta.env.VITE_LIVEKIT_API_URL || 'https://livekit.voicebot.whilter.ai';

interface TokenRequest {
  identity: string;
  metadata: {
    stt: string;
    llm: string;
    tts: string;
  };
}

export const fetchLivekitAuthToken = async (request: TokenRequest) => {
  try {
    const response = await fetch(`${apiUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch token');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching token:', error);
    throw error;
  }
};
