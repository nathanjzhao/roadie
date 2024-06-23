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


  
  if (readyState === VoiceReadyState.OPEN) {return (
    <div className="flex justify-center mt-4">
      <div>
        <button className="font-semibold text-center p-2 bg-orange-300 rounded shadow-lg"
          onClick={() => {
            disconnect();
            start();
          }}
        >
          End Session
        </button>
        <button className={`ml-4 font-semibold text-center p-2 rounded border border-gray-400 shadow-lg ${!isMuted ? 'bg-blue-400' : 'bg-blue-500'}`}
          onClick={toggleMute}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>
    </div>
  );
  }


  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-1/5 h-1/5 flex flex-col items-center justify-center bg-gray-100 p-4 rounded shadow-lg">
        <FaceWidgets connectVoice={connect} sendSessionSettings={sendSessionSettings} sendUserInput={sendUserInput} sendAssistantInput={sendAssistantInput}/>
        <hr className="my-4 w-full border-t border-white-300" /> 
        <button 
          className="font-semibold text-center p-2 rounded border border-gray-400 bg-orange-300 shadow-lg mt-4"
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
    </div>
  );
}
