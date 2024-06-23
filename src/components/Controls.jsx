// ./components/Controls.tsx
"use client";
import React, { useEffect } from "react";
import { useVoice, VoiceReadyState } from "@humeai/voice-react";
import { usePorcupine } from "@picovoice/porcupine-react";
import { FaceWidgets } from "@/components/widgets/FaceWidgets";

const PORCUPINE_KEYWORD_BASE64 = require("@/constants/keywordParams")
const PORCUPINE_MODEL_BASE64 = require("@/constants/modelParams")
const PORCUPINE_KEYWORD2_BASE64 = require("@/constants/test2")
const PORCUPINE_MODEL2_BASE64 = require("@/constants/test")


const porcupineKeyword = {
  base64: PORCUPINE_KEYWORD_BASE64,
  label: "Hey Roadie",
}

const porcupineModel = {
  base64: PORCUPINE_MODEL_BASE64
}

const porcupineKeyword2 = {
  base64: PORCUPINE_KEYWORD2_BASE64,
  label: "Bye bye Roadie",
}

const porcupineModel2 = {
  base64: PORCUPINE_MODEL2_BASE64,
}

export default function Controls() {
  const { connect, disconnect, sendSessionSettings, sendUserInput, sendAssistantInput, readyState } = useVoice();

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
  
  // useEffect(() => {
  //   console.log('keywordDetection:', keywordDetection);
  //   console.log('isLoaded:', isLoaded);
  //   console.log('isListening:', isListening);
  //   console.log('error:', error);
  //   console.log('init:', init);
  //   console.log('start:', start);
  //   console.log('stop:', stop);
  //   console.log('release:', release);
  // }, [keywordDetection, isLoaded, isListening, error, init, start, stop, release]);

  const startPpn = async () => {
    if (!isLoaded) {
      await init(
        process.env.NEXT_PUBLIC_PORCUPINE_API_KEY,
        [porcupineKeyword, porcupineKeyword2],
        porcupineModel
      );
    }

    await start();
  }

  useEffect(() => {
    startPpn();
  }, []);


  useEffect(() => {
    if (keywordDetection !== null && keywordDetection.label === "Hey Roadie" && readyState !== VoiceReadyState.OPEN) {
      connect();
      stop();
      release();
    }
    if (keywordDetection !== null && keywordDetection.label === "Bye bye Roadie" && readyState === VoiceReadyState.OPEN) {
      disconnect();
      start();
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
    <>
      <FaceWidgets connectVoice={connect} sendSessionSettings={sendSessionSettings} sendUserInput={sendUserInput} sendAssistantInput={sendAssistantInput}/>
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
    </>
  );
}
