// ./components/Controls.tsx
"use client";
import React, { useEffect } from "react";
import { useVoice, VoiceReadyState } from "@humeai/voice-react";
import { usePorcupine } from "@picovoice/porcupine-react";
import { FaceWidgets } from "@/components/widgets/FaceWidgets";
import Cookies from 'js-cookie';

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
  const { connect, disconnect, sendSessionSettings, sendUserInput, sendAssistantInput, mute, unmute, isMuted, readyState, messages } = useVoice();

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
    if (messages.length == 2) {
      const messageWithIds = {
        ...messages[1],
      };
      // Assuming you have a function to add to cookies
      console.log(messageWithIds)
      Cookies.set('messageWithIds', JSON.stringify(messageWithIds));
    }
  }, [messages]);

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
        [porcupineKeyword, porcupineKeyword2], // Hey Roadie, Bye bye Roadie
        porcupineModel
      );
    }

    await start();
  }

  useEffect(() => {
    startPpn();
  }, []);

  useEffect(() => {
    const handleVoiceCommands = async () => {
      if (keywordDetection !== null && keywordDetection.label === "Hey Roadie" && readyState !== VoiceReadyState.OPEN) {
        connect();
        stop();
        release();
      }
      if (keywordDetection !== null && keywordDetection.label === "Bye bye Roadie" && readyState === VoiceReadyState.OPEN) {
        disconnect();
        start();
      }
    };
  
    handleVoiceCommands();
  }, [keywordDetection]);


  const toggleMute = () => {
    if (isMuted) {
      unmute();
    } else {
      mute();
    }
  };


  
  if (readyState === VoiceReadyState.OPEN) {
    return (
      <div>
        <button className="font-semibold text-center p-6 bg-gray-200 rounded border border-gray-400 shadow-lg"
          onClick={() => {
            disconnect();
            start();
          }}
        >
          End Session
        </button>
        <button className="font-semibold text-center p-6 ml-4 bg-gray-200 rounded border border-gray-400 shadow-lg" // Step 3: Mute/Unmute button
          onClick={toggleMute}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>
    );
  }


  return (
    <div className="ml-96">
      <FaceWidgets connectVoice={connect} sendSessionSettings={sendSessionSettings} sendUserInput={sendUserInput} sendAssistantInput={sendAssistantInput}/>
      <button className="font-semibold text-center p-2 bg-gray-200 rounded border border-gray-400 shadow-lg"
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
    </div>
  );
}
