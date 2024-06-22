// ./components/Controls.tsx
"use client";
import { useVoice, VoiceReadyState } from "@humeai/voice-react";
export default function Controls() {
  const { connect, disconnect, readyState } = useVoice();

  if (readyState === VoiceReadyState.OPEN) {
    return (
      <button
        onClick={() => {
          disconnect();
        }}
      >
        End Session
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        connect()
          .then(() => {
            console.log("Connected")
            /* handle success */
          })
          .catch(() => {
            console.log("Error")
            /* handle error */
          });
      }}
    >
      Start Session
    </button>
  );
}
