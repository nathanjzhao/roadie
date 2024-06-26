"use client";
import { VoiceProvider } from "@humeai/voice-react";
import Messages from "./Controls2";
import Controls from "./Messages";

export default function ClientComponent({
  accessToken,
}) {
  return (
    <VoiceProvider 
      auth={{ type: "accessToken", value: accessToken }}
      configId={process.env.NEXT_PUBLIC_HUME_CONFIG_ID}
    >
      <Messages />
      <Controls />
    </VoiceProvider>
  );
}
