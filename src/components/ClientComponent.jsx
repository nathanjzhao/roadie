"use client";
import { VoiceProvider } from "@humeai/voice-react";
import Messages from "./Controls";
import Controls from "./Messages";

export default function ClientComponent({
  accessToken,
}) {
  console.log(process.env.NEXT_PUBLIC_HUME_CONFIG_ID)
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
