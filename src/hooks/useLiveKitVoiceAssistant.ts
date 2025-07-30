import { config } from './../../node_modules/rxjs/src/internal/config';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteParticipant,
  LocalParticipant,
  createLocalTracks,
  ConnectionState,
  DataPacket_Kind,
  type RoomOptions,
  RemoteTrackPublication,
  DisconnectReason,
} from 'livekit-client';
import { fetchLivekitAuthToken } from '@/actions/livekitActons';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TranscriptionData {
  type: 'transcription' | 'partial_transcription';
  text: string;
  speaker: 'user' | 'assistant';
  isFinal: boolean;
}

interface VoiceBotConfig {
  identity: string;
  stt: string;
  llm: string;
  tts: string;
}
type ConfigType = VoiceBotConfig;

interface UseLiveKitVoiceAssistantProps {
  onMessage?: (message: Message) => void;
  onPartialTranscript?: (transcript: string, speaker: 'user' | 'assistant') => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
  onAgentStateChange?: (state: string) => void;
}
const LIVEKIT_SOCKET_URL = import.meta.env.VITE_LIVEKIT_SOCKET_URL || 'wss://websocket.voicebot.whilter.ai';

export const useLiveKitVoiceAssistant = ({
  onMessage,
  onPartialTranscript,
  onConnectionStateChange,
  onAgentStateChange,
}: UseLiveKitVoiceAssistantProps) => {
  const [room] = useState(
    () =>
      new Room({
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
        },
        reconnectPolicy: {
          maxRetries: 5,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          nextRetryDelayInMs: (context: any) => Math.min(context.attemptNumber * 1000, 5000),
        },
      } as RoomOptions)
  );

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [agentState, setAgentState] = useState<string>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [currentUserTranscript, setCurrentUserTranscript] = useState<string>('');
  const [currentAssistantTranscript, setCurrentAssistantTranscript] = useState<string>('');
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const transcriptionBufferRef = useRef<{ user: string; assistant: string }>({ user: '', assistant: '' });
  // wss://ip.livebot.mltrainer.online/rtc?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjQ5MDU2OTA3NDcsImlzcyI6IkFQSTd5VHozWDdkTlllbSIsIm5hbWUiOiJ1c2VyMSIsIm5iZiI6MTc1MjA5MDc0Nywic3ViIjoidXNlcjEiLCJ2aWRlbyI6eyJyb29tIjoibXktZmlyc3Qtcm9vbSIsInJvb21Kb2luIjp0cnVlfH0.2QczX6N3Lx3z8oKtpZ26yKX8SxNeHJ2TwBl0quGw2IU

  const getAuthToken = async (config:ConfigType) => {
    const { token } = await fetchLivekitAuthToken({
      identity: config.identity,
      metadata: {
        stt: config.stt,
        llm: config.llm,
        tts: config.tts,
      },
    });

    if (!token) {
      throw new Error('No authentication token available');
    }

    return token;
  };

  // Connect to LiveKit room
  const connect = useCallback(async (config: ConfigType) => {
    try {
      setError(null);

      // Parse WebSocket URL and token
      // const url = 'wss://websocket.voicebot.whilter.ai/';
      // const token = new URL(url + '?access_token=iiiiiiiii').searchParams.get('access_token') || '';
      // const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjQ5MDU2OTA3NDcsImlzcyI6IkFQSTd5VHozWDdkTlllbSIsIm5hbWUiOiJ1c2VyMSIsIm5iZiI6MTc1MjA5MDc0Nywic3ViIjoidXNlcjEiLCJ2aWRlbyI6eyJyb29tIjoibXktZmlyc3Qtcm9vbSIsInJvb21Kb2luIjp0cnVlfH0.2QczX6N3Lx3z8oKtpZ26yKX8SxNeHJ2TwBl0quGw2IU';
      // const roomName = `room-${Date.now()}`;
      const token = await getAuthToken(config);

      // Connect to room
      // await room.connect(url, token, { roomName });
      await room.connect(LIVEKIT_SOCKET_URL, token);
      console.log('Connected to LiveKit:');

      // Create and publish audio track
      const [audioTrack] = await createLocalTracks({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          channelCount: 1,
        },
      });

      await room.localParticipant.publishTrack(audioTrack);
      console.log('Published audio track');

      setIsConnected(true);
    } catch (err) {
      console.error('Connection failed:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
    }
  }, [room, config]);

  // Disconnect from room
  const disconnect = useCallback(async () => {
    audioElementsRef.current.forEach((element) => {
      element.pause();
      element.srcObject = null;
      element.remove();
    });
    audioElementsRef.current.clear();

    setCurrentUserTranscript('');
    setCurrentAssistantTranscript('');
    transcriptionBufferRef.current = { user: '', assistant: '' };

    await room.disconnect();
    setIsConnected(false);
    setAgentState('disconnected');
  }, [room]);

  // Set up room event listeners
  useEffect(() => {
    const handleConnectionStateChanged = (state: ConnectionState) => {
      console.log('Connection state changed:', state);
      setConnectionState(state);
      onConnectionStateChange?.(state);
    };

    const handleParticipantConnected = (participant: RemoteParticipant) => {
      console.log('Participant connected:', participant.identity);
      if (participant.identity.includes('agent')) {
        console.log('🤖 Agent connected');
        if (participant.metadata) {
          try {
            const metadata = JSON.parse(participant.metadata);
            if (metadata.agent_state) {
              console.log('Initial agent state:', metadata.agent_state);
              setAgentState(metadata.agent_state);
              onAgentStateChange?.(metadata.agent_state);
            }
          } catch (e) {
            console.error('Failed to parse agent metadata:', e);
          }
        }
      }
    };

    const handleParticipantMetadataChanged = (
      metadata: string | undefined,
      participant: RemoteParticipant | LocalParticipant
    ) => {
      if (participant.identity.includes('agent') && metadata) {
        try {
          const parsedMetadata = JSON.parse(metadata);
          if (parsedMetadata.agent_state) {
            console.log('🔄 Agent state:', parsedMetadata.agent_state);
            setAgentState(parsedMetadata.agent_state);
            onAgentStateChange?.(parsedMetadata.agent_state);
          }
        } catch (e) {
          console.error('Failed to parse metadata:', e);
        }
      }
    };

    const handleTrackSubscribed = (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      console.log('Track subscribed:', track.kind, 'from', participant.identity);
      if (track.kind === Track.Kind.Audio && participant.identity.includes('agent')) {
        const audioElement = track.attach();
        audioElement.autoplay = true;
        audioElement.style.display = 'none';
        audioElement.volume = 1.0;
        document.body.appendChild(audioElement);

        const trackId = track.sid || `track-${Date.now()}`;
        audioElementsRef.current.set(trackId, audioElement);

        audioElement.play().catch((e) => {
          console.error('Failed to play audio:', e);
          document.addEventListener(
            'click',
            () => audioElement.play().catch(console.error),
            { once: true }
          );
        });

        console.log('🔊 Agent audio track attached and playing');
      }
    };

    const handleTrackUnsubscribed = (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
      if (track.kind === Track.Kind.Audio && track.sid) {
        const audioElement = audioElementsRef.current.get(track.sid);
        if (audioElement) {
          track.detach(audioElement);
          audioElement.remove();
          audioElementsRef.current.delete(track.sid);
        }
      }
    };

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      kind?: DataPacket_Kind,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      topic?: string
    ) => {
      if (!participant) return;

      try {
        const decoder = new TextDecoder();
        const dataString = decoder.decode(payload);
        console.log('📥 Raw data received:', dataString);

        let data: TranscriptionData;
        try {
          data = JSON.parse(dataString);
        } catch (parseError) {
          console.error('❌ Failed to parse JSON data:', parseError);
          return;
        }

        if (!data.type || !data.speaker || data.text === undefined) {
          console.warn('⚠️ Invalid transcription data structure:', data);
          return;
        }

        console.log('📝 Transcription received:', {
          type: data.type,
          speaker: data.speaker,
          isFinal: data.isFinal,
          text: data.text.slice(0, 50) + (data.text.length > 50 ? '...' : ''),
        });

        if (data.type === 'transcription' || data.type === 'partial_transcription') {
          const isFinal = data.isFinal || data.type === 'transcription';

          if (!isFinal) {
            if (data.speaker === 'user') {
              transcriptionBufferRef.current.user = data.text;
              setCurrentUserTranscript(data.text);
            } else if (data.speaker === 'assistant') {
              transcriptionBufferRef.current.assistant = data.text;
              setCurrentAssistantTranscript(data.text);
            }
            onPartialTranscript?.(data.text, data.speaker);
          } else {
            if (data.speaker === 'user') {
              setCurrentUserTranscript('');
              transcriptionBufferRef.current.user = '';
            } else if (data.speaker === 'assistant') {
              setCurrentAssistantTranscript('');
              transcriptionBufferRef.current.assistant = '';
            }

            if (data.text.trim()) {
              const message: Message = {
                id: `${data.speaker}-${Date.now()}-${Math.random()}`,
                role: data.speaker,
                content: data.text,
                timestamp: new Date(),
              };
              console.log('💬 Final message added:', message);
              onMessage?.(message);
            }
          }
        }
      } catch (error) {
        console.error('❌ Failed to process transcription data:', error);
      }
    };

    const handleDisconnected = (reason?: DisconnectReason) => {
      console.log('🔌 Disconnected:', reason);
      setIsConnected(false);
      setConnectionState(ConnectionState.Disconnected);
      setCurrentUserTranscript('');
      setCurrentAssistantTranscript('');
      transcriptionBufferRef.current = { user: '', assistant: '' };

      audioElementsRef.current.forEach((element) => {
        element.pause();
        element.srcObject = null;
        element.remove();
      });
      audioElementsRef.current.clear();
    };

    room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantMetadataChanged, handleParticipantMetadataChanged);
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    room.on(RoomEvent.DataReceived, handleDataReceived);
    room.on(RoomEvent.Disconnected, handleDisconnected);

    return () => {
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantMetadataChanged, handleParticipantMetadataChanged);
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room, onMessage, onPartialTranscript, onConnectionStateChange, onAgentStateChange]);

  return {
    connect,
    disconnect,
    isConnected,
    connectionState,
    agentState,
    error,
    room,
    currentUserTranscript,
    currentAssistantTranscript,
  };
};