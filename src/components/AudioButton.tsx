// src/components/AudioButton.tsx
"use client";

import React, { useState } from "react";
import { ConnectionState } from "livekit-client";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  STT_OPTIONS,
  LLM_OPTIONS,
  TTS_OPTIONS,
  type VoiceBotConfig
} from "@/types/voice";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
// import { AiOutlineAudio, AiOutlineAudioMuted } from "react-icons/ai";
import { useLiveKitVoiceAssistant } from "@/hooks/useLiveKitVoiceAssistant";

const AudioButton: React.FC = () => {
  const [config, setConfig] = useState<VoiceBotConfig>({
    stt: "openai",
    llm: "openai",
    tts: "elevenlabs",
    identity: "",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messages, setMessages] = useState<any[]>([]);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  console.log("Initial config:", config);

  const {
    connect,
    disconnect,
    isConnected,
    error,
    currentUserTranscript,
    currentAssistantTranscript,
    connectionState,
    agentState,
  } = useLiveKitVoiceAssistant({
    onMessage: (message) => {
      setMessages((prev) => [...prev, message]);
    },
    onPartialTranscript: (transcript, speaker) => {
      console.log(`Partial transcript from ${speaker}: ${transcript}`);
    },
    onConnectionStateChange: (state) => {
      console.log(`Connection state: ${state}`);
    },
    onAgentStateChange: (state) => {
      console.log(`Agent state: ${state}`);
    },
  });

  const toggleRecording = async () => {
    if (!config.identity) {
      setPhoneError("Phone number is required");
      return;
    }

    try {
      if (isConnected) {
        await disconnect();
      } else {
        await connect(config);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error toggling recording:", error);
    }
  };

  const renderDropdown = (
    label: string,
    options: typeof STT_OPTIONS,
    value: string,
    onChange: (value: string) => void
  ) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isConnected}
        className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="p-4 w-full mx-auto  bg-white">
      {error && (
        <p className="text-red-500 mb-4 p-2 bg-red-100 rounded">{error}</p>
      )}

      {/* <div className="grid grid-cols-3 gap-4 mb-4">
        {renderDropdown("Speech-to-Text", STT_OPTIONS, config.stt, (value) =>
          setConfig((prev) => ({
            ...prev,
            stt: value as VoiceBotConfig["stt"],
          }))
        )}

        {renderDropdown("Language Model", LLM_OPTIONS, config.llm, (value) =>
          setConfig((prev) => ({
            ...prev,
            llm: value as VoiceBotConfig["llm"],
          }))
        )}

        {renderDropdown("Text-to-Speech", TTS_OPTIONS, config.tts, (value) =>
          setConfig((prev) => ({
            ...prev,
            tts: value as VoiceBotConfig["tts"],
          }))
        )}

        <div className="mb-4 col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <PhoneInput
            placeholder="Enter your phone number"
            value={config.identity}
            onChange={(value) => {
              setConfig((prev) => ({ ...prev, identity: value }));
              setPhoneError(null);
            }}
            defaultCountry="IN"
            disabled={isConnected}
            className="w-full"
          />
          {phoneError && (
            <p className="text-red-500 text-sm mt-1">{phoneError}</p>
          )}
        </div>

        <div className="flex items-end mb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block w-full sm:w-auto">
                <Button
                  type="submit"
                  onClick={toggleRecording}
                  disabled={connectionState === ConnectionState.Connecting}
                  className={`px-6 py-2 rounded-lg text-white font-medium transition-colors ${
                    connectionState === ConnectionState.Connected
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-blue-500 hover:bg-blue-600"
                  } ${
                    connectionState === ConnectionState.Connecting
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  {connectionState === ConnectionState.Connecting ? (
                    "Connecting..."
                  ) : isConnected ? (
                    <AiOutlineAudio className="h-5 w-5" />
                  ) : (
                    <AiOutlineAudioMuted className="h-5 w-5" />
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Web Call</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div> */}

      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* First row dropdowns remain unchanged */}
        {renderDropdown("Speech-to-Text", STT_OPTIONS, config.stt, (value) =>
          setConfig((prev) => ({
            ...prev,
            stt: value as VoiceBotConfig["stt"],
          }))
        )}
        {renderDropdown("Language Model", LLM_OPTIONS, config.llm, (value) =>
          setConfig((prev) => ({
            ...prev,
            llm: value as VoiceBotConfig["llm"],
          }))
        )}
        {renderDropdown("Text-to-Speech", TTS_OPTIONS, config.tts, (value) =>
          setConfig((prev) => ({
            ...prev,
            tts: value as VoiceBotConfig["tts"],
          }))
        )}

        {/* Second row - phone input and button */}
        <div className="col-span-3 flex items-start gap-4">
          {/* Phone input with label */}
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="flex items-center gap-4">
              <PhoneInput
                placeholder="Enter your phone number"
                value={config.identity}
                onChange={(value) => {
                  setConfig((prev) => ({ ...prev, identity: value }));
                  setPhoneError(null);
                }}
                defaultCountry="IN"
                disabled={isConnected}
                className="flex-grow"
              />

              {/* Button aligned with input field */}
              <div className="flex-shrink-0 h-[40px] flex items-center">
                <TooltipProvider>
                  {/* Match input height */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        onClick={toggleRecording}
                        disabled={
                          connectionState === ConnectionState.Connecting
                        }
                        className={` h-10 rounded-lg text-white font-medium transition-colors ${
                          connectionState === ConnectionState.Connected
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-blue-500 hover:bg-blue-600"
                        } ${
                          connectionState === ConnectionState.Connecting
                            ? "cursor-not-allowed opacity-50"
                            : ""
                        }`}
                      >
                        {connectionState === ConnectionState.Connecting ? (
                          "Connecting..."
                        ) : isConnected ? (
                          <Mic className="h-5 w-5" />
                        ) : (
                          <MicOff className="h-5 w-5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Web Call</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            {phoneError && (
              <p className="text-red-500 text-sm mt-1">{phoneError}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <p className="text-sm font-semibold">
            Connection State:{" "}
            <span className="text-gray-700">{connectionState}</span>
          </p>
          <p className="text-sm font-semibold">
            Agent State: <span className="text-gray-700">{agentState}</span>
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">User Transcript:</p>
          <p className="text-gray-700 bg-gray-100 p-2 rounded">
            {currentUserTranscript || "No transcript"}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Assistant Transcript:</p>
          <p className="text-gray-700 bg-gray-100 p-2 rounded">
            {currentAssistantTranscript || "No transcript"}
          </p>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Messages:</h3>
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages yet</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {messages.map((msg) => (
                <li
                  key={msg.id}
                  className="text-sm bg-white p-2 rounded shadow"
                >
                  <span className="text-gray-500">
                    [{msg.timestamp.toLocaleTimeString()}]
                  </span>{" "}
                  <strong>{msg.role}:</strong> {msg.content}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioButton;
