// ./components/Controls.tsx
"use client";
import React, { useEffect } from "react";
import { useVoice, VoiceReadyState } from "@humeai/voice-react";
import { usePorcupine } from "@picovoice/porcupine-react";

const PORCUPINE_KEYWORD_BASE64 = require("@/constants/keywordParams")
const PORCUPINE_MODEL_BASE64 = require("@/constants/modelParams")

const PORC_KEY = require("@/constants/test2")
const PORC_BASE = require("@/constants/test")

const porcupineKeyword = {
  base64: PORCUPINE_KEYWORD_BASE64,
  label: "Hey Roadie",
}

const offKeyword = {
  base64: PORC_KEY,
  label: "Bye bye Roadie"
}

const porcupineModel = {
  base64: PORCUPINE_MODEL_BASE64
}

const porcOffModel = {
  base64: PORC_BASE
}

export default function Controls() {
  const { connect, disconnect, readyState } = useVoice();

  const {
    keywordDetection,
    isLoaded,
    isListening,
    error,
    init,
    start,
    stop,
    release,
  } = usePorcupine();
  
   useEffect(() => {
     console.log('keywordDetection:', keywordDetection);
     console.log('isLoaded:', isLoaded);
     console.log('isListening:', isListening);
     console.log('error:', error);
     console.log('init:', init);
     console.log('start:', start);
     console.log('stop:', stop);
     console.log('release:', release);
   }, [keywordDetection, isLoaded, isListening, error, init, start, stop, release]);

  const startPpn = async () => {
    if (!isLoaded) {
      await init(
        process.env.NEXT_PUBLIC_PORCUPINE_API_KEY,
        porcupineKeyword,
        porcupineModel
      );
    }

    await start();
  }

  useEffect(() => {
    startPpn();
  }, []);


  useEffect(() => {
    if (keywordDetection !== null && keywordDetection.label == "Hey Roadie") {
      console.log("lol")
      connect();
      stop();
    }

    if (keywordDetection && keywordDetection.label === "Bye bye Roadie") {
      console.log("lolsizes")
      disconnect();
    }
  }, [keywordDetection]);


  if (readyState === VoiceReadyState.OPEN) {
    return (
      <button
        onClick={() => {
          disconnect();
          start();
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
