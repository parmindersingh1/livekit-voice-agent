export interface VoiceBotConfig {
  stt: 'openai' | 'self-hosted';
  llm: 'openai' | 'self-hosted';
  tts: 'elevenlabs' | 'self-hosted';
  identity: string;
}
export type VoiceBotConfigOptions = {
  stt: 'openai' | 'self-hosted';
  llm: 'openai' | 'self-hosted';
  tts: 'elevenlabs' | 'self-hosted';
};
export const STT_OPTIONS = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'self-hosted', name: 'Self Hosted' }
];

export const LLM_OPTIONS = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'self-hosted', name: 'Self Hosted' }
];

export const TTS_OPTIONS = [
  { id: 'elevenlabs', name: 'ElevenLabs' },
  { id: 'self-hosted', name: 'Self Hosted' }
];