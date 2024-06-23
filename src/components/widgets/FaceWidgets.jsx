import { Emotion, EmotionName } from "../../lib/data/emotion";
import { None, Optional } from "../../lib/utilities/typeUtilities";
import { useContext, useEffect, useRef, useState } from "react";

import { Descriptor } from "./Descriptor";
import { FacePrediction } from "../../lib/data/facePrediction";
import { FaceTrackedVideo } from "./FaceTrackedVideo";
import { LoaderSet } from "./LoaderSet";
import { TopEmotions } from "./TopEmotions";
import { TrackedFace } from "../../lib/data/trackedFace";
import { VideoRecorder } from "../../lib/media/videoRecorder";
import { blobToBase64 } from "../../lib/utilities/blobUtilities";
import { getApiUrlWs } from "../../lib/utilities/environmentUtilities";

import useConsistentPresence from '@/lib/hooks/useConsistentPresence';

const trackingFacesPlaceholder = [{
  boundingBox: {
    x: -20,
    y: -20, 
    h: 0,
    w: 0,
  }
}]

export function FaceWidgets({ onCalibrate, connectVoice, sendSessionSettings, sendUserInput, sendAssistantInput}) {
  const socketRef = useRef(null);
  const recorderRef = useRef(null);
  const photoRef = useRef(null);
  const mountRef = useRef(true);
  const recorderCreated = useRef(false);
  const numReconnects = useRef(0);
  const [trackedFaces, setTrackedFaces] = useState([]);
  const [emotions, setEmotions] = useState([]);
  const [status, setStatus] = useState("");
  const numLoaderLevels = 5;
  const maxReconnects = 3;
  const loaderNames = [
    "Tiredness",
    "Contemplation",
    "Boredom",
    "Surprise (positive)",
    "Disgust",
    "Joy",
    "Anger",
    "Confusion",
  ];
  
  const [isVideoRunning, setIsVideoRunning] = useState(true);

  useEffect(() => {
    console.log("Mounting component");
    mountRef.current = true;
    console.log("Connecting to server");
    connect();
    setIsVideoRunning(true);
  
    return () => {
      console.log("Tearing down component");
      stopEverything();
      setIsVideoRunning(false);
    };
  }, []);

  function connect() {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log("Socket already exists, will not create");
    } else {
      const baseUrl = "https://api.hume.ai";
      const endpointUrl = `${baseUrl}/v0/stream/models`;
      const socketUrl = `${endpointUrl}?apikey=${process.env.NEXT_PUBLIC_HUME_API_KEY}`;
      console.log(`Connecting to websocket... (using ${endpointUrl})`);
      setStatus(`Connecting to server...`);

      const socket = new WebSocket(socketUrl);

      socket.onopen = socketOnOpen;
      socket.onmessage = socketOnMessage;
      socket.onclose = socketOnClose;
      socket.onerror = socketOnError;

      socketRef.current = socket;
    }
  }

  async function socketOnOpen() {
    console.log("Connected to websocket");
    setStatus("Connecting to webcam...");
    if (recorderRef.current) {
      console.log("Video recorder found, will use open socket");
      await capturePhoto();
    } else {
      console.warn("No video recorder exists yet to use with the open socket");
      await capturePhoto();
    }
  }

  async function socketOnMessage(event) {
    setStatus("");
    const response = JSON.parse(event.data);
    // console.log("Got response", response);
    const predictions = response.face?.predictions || [];
    const warning = response.face?.warning || "";
    const error = response.error;
    if (error) {
      setStatus(error);
      console.error(error);
      stopEverything();
      return;
    }

    if (predictions.length === 0) {
      setStatus(warning.replace(".", ""));
      setEmotions([]);
    }

    const newTrackedFaces = [];
    predictions.forEach(async (pred, dataIndex) => {
      newTrackedFaces.push({ boundingBox: pred.bbox });
      if (dataIndex === 0) {
        const newEmotions = pred.emotions;
        setEmotions(newEmotions);
        if (onCalibrate) {
          onCalibrate(newEmotions);
        }
      }
    });
    setTrackedFaces(newTrackedFaces);

    await capturePhoto();
  }

  async function socketOnClose(event) {
    console.log("Socket closed");

    if (mountRef.current === true) {
      setStatus("Reconnecting");
      console.log("Component still mounted, will reconnect...");
      connect();
    } else {
      console.log("Component unmounted, will not reconnect...");
    }
  }

  async function socketOnError(event) {
    console.error("Socket failed to connect: ", event);
    if (numReconnects.current >= maxReconnects) {
      setStatus(`Failed to connect to the Hume API.
      Please log out and verify that your API key is correct.`);
      stopEverything();
    } else {
      numReconnects.current++;
      console.warn(`Connection attempt ${numReconnects.current}`);
    }
  }

  function stopEverything() {
    console.log("Stopping everything...");
    // mountRef.current = false;
    const socket = socketRef.current;
    if (socket) {
      console.log("Closing socket");
      socket.close();
      socketRef.current = null;
    } else {
      console.warn("Could not close socket, not initialized yet");
    }
    const recorder = recorderRef.current;
    if (recorder) {
      console.log("Stopping recorder");
      recorder.stopRecording();
      recorderRef.current = null;
    } else {
      console.warn("Could not stop recorder, not initialized yet");
    }
  }

  async function onVideoReady(videoElement) {
    console.log("Video element is ready");

    if (!photoRef.current) {
      console.error("No photo element found");
      return;
    }

    if (!recorderRef.current && recorderCreated.current === false) {
      console.log("No recorder yet, creating one now");
      recorderCreated.current = true;
      const recorder = await VideoRecorder.create(videoElement, photoRef.current);

      recorderRef.current = recorder;
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("Socket open, will use the new recorder");
        await capturePhoto();
      } else {
        console.warn("No socket available for sending photos");
      }
    }
  }

  async function capturePhoto() {
    const recorder = recorderRef.current;

    if (!recorder) {
      console.error("No recorder found");
      return;
    }

    const photoBlob = await recorder.takePhoto();
    sendRequest(photoBlob);
  }

  async function sendRequest(photoBlob) {
    const socket = socketRef.current;

    if (!socket) {
      console.error("No socket found");
      return;
    }

    const encodedBlob = await blobToBase64(photoBlob);
    const requestData = JSON.stringify({
      data: encodedBlob,
      models: {
        face: {},
      },
    });

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(requestData);
    } else {
      console.error("Socket connection not open. Will not capture a photo");
      socket.close();
    }
  }
  async function toggleVideo() {
    if (isVideoRunning) {
      // Stop the video
      // stopEverything();
      setIsVideoRunning(false);
      socketRef.current = null;
    } else {
      // Start the video
      console.log("Mounting component");
      connect();
      setIsVideoRunning(true);
    }
  }

  const [top2Emotions, setTop2Emotions] = useState([]);
  const [top4Emotions, setTop4Emotions] = useState([]);
  
  useEffect(() => {
    const sortedEmotions = [...emotions].sort((a, b) => b.value - a.value);
    const top2 = sortedEmotions.slice(0, 2).map(e => e.name);
    const top4 = sortedEmotions.slice(0, 4).map(e => e.name);
    setTop2Emotions(top2);
    setTop4Emotions(top4);
  }, [emotions]);

  const isTirednessConsistentlyPresent = useConsistentPresence(top4Emotions, "Tiredness", 5000);
  const isContemplationConsistentlyPresent = useConsistentPresence(top4Emotions, "Contemplation", 10000);
  const isSurpriseConsistentlyPresent = useConsistentPresence(top4Emotions, "Surprise (positive)", 1000);
  const isBoredomConsistentlyPresent = useConsistentPresence(top2Emotions, "Boredom", 20000);

  useEffect(() => {
    if (isTirednessConsistentlyPresent) {
      connectVoice();

      // Wait for an additional 2 seconds before calling sendAssistantInput
      setTimeout(() => {
        sendAssistantInput("You seem tired. What can I do to keep you up?");
      }, 2000); // 2 seconds
    }
    if (isContemplationConsistentlyPresent) {
      connectVoice();

      // Wait for an additional 2 seconds before calling sendAssistantInput
      setTimeout(() => {
        sendAssistantInput("What are you thinking about? I'd like to hear.");
      }, 2000); // 2 seconds
    }
    if (isSurpriseConsistentlyPresent) {
      connectVoice();

      // Wait for an additional 2 seconds before calling sendAssistantInput
      setTimeout(() => {
        sendAssistantInput("Woah! What happened? Why are you surprised?");
      }, 2000); // 2 seconds
    }
    if (isBoredomConsistentlyPresent) {
      connectVoice();

      // Wait for an additional 2 seconds before calling sendAssistantInput
      setTimeout(() => {
        sendAssistantInput("You seem bored. Want to hear a joke?");
      }, 2000); // 2 seconds
    }
  }, [isTirednessConsistentlyPresent, isContemplationConsistentlyPresent, isSurpriseConsistentlyPresent, isBoredomConsistentlyPresent]);



  // const tirednessTimerRef = useRef(null);
  // const contemplationTimerRef = useRef(null);
  // const surpriseTimerRef = useRef(null);
  // const boredomTimerRef = useRef(null);

  // useEffect(() => {
  //   const checkAndConnectVoice = () => {
  //     // Assuming 'emotions' is an array of objects like [{ emotion: 'calmness', value: 0.9 }, ...]
  //     // Sort emotions by value in descending order
  //     const sortedEmotions = [...emotions].sort((a, b) => b.value - a.value);
  //     const top2Emotions = sortedEmotions.slice(0, 2).map(e => e.name);
  //     const top4Emotions = sortedEmotions.slice(0, 4).map(e => e.name);
  //     console.log(top4Emotions)
  
  //     if (top4Emotions.includes('Tiredness')) {
  //       // Start or reset a 30-second timer
  //       if (tirednessTimerRef.current) clearTimeout(tirednessTimerRef.current);
  //       tirednessTimerRef.current = setTimeout(() => {
  //         connectVoice();

  //         // Wait for an additional 2 seconds before calling sendAssistantInput
  //         setTimeout(() => {
  //           sendAssistantInput("You seem tired. What can I do to keep you up?");
  //         }, 2000); // 2 seconds
  //       }, 300); // 1 seconds
  //     } else {
  //       // If conditions are not met, clear the timer
  //       if (tirednessTimerRef.current) {
  //         clearTimeout(tirednessTimerRef.current);
  //         tirednessTimerRef.current = null;
  //       }
  //     }

  //     if (top2Emotions.includes('Contemplation')) {
  //       // Start or reset a 30-second timer
  //       if (contemplationTimerRef.current) clearTimeout(contemplationTimerRef.current);
  //       contemplationTimerRef.current = setTimeout(() => {
  //         connectVoice();
          
  //         // Wait for an additional 2 seconds before calling sendAssistantInput
  //         setTimeout(() => {
  //           sendAssistantInput("What are you thinking about? I'd like to hear.");
  //         }, 2000); // 2 seconds
  //       }, 7000); // 7 seconds
  //     } else {
  //       // If conditions are not met, clear the timer
  //       if (contemplationTimerRef.current) {
  //         clearTimeout(contemplationTimerRef.current);
  //         contemplationTimerRef.current = null;
  //       }
  //     }

  //     if (top2Emotions.includes('Surprise (positive)') || top2Emotions.includes('Surprise (negative)')) {
  //       // Start or reset a 30-second timer
  //       if (surpriseTimerRef.current) clearTimeout(surpriseTimerRef.current);
  //       surpriseTimerRef.current = setTimeout(() => {
  //         connectVoice();
          
  //         // Wait for an additional 2 seconds before calling sendAssistantInput
  //         setTimeout(() => {
  //           sendAssistantInput("Woah! What happened? Why are you surprised?");
  //         }, 2000); // 2 seconds
  //       }, 2000); // 2000 seconds
  //     } else {
  //       // If conditions are not met, clear the timer
  //       if (surpriseTimerRef.current) {
  //         clearTimeout(surpriseTimerRef.current);
  //         surpriseTimerRef.current = null;
  //       }
  //     }

  //     if (top2Emotions.includes('Boredom')) {
  //       // Start or reset a 30-second timer
  //       console.log(boredomTimerRef.current)
  //       if (boredomTimerRef.current) clearTimeout(boredomTimerRef.current);
  //       boredomTimerRef.current = setTimeout(() => {
  //         connectVoice();
          
  //         // Wait for an additional 2 seconds before calling sendAssistantInput
  //         setTimeout(() => {
  //           sendAssistantInput("You seem bored. Want to hear a joke?");
  //         }, 2000); // 2 seconds
  //       }, 10000); // 10 seconds
  //     } else {
  //       // If conditions are not met, clear the timer
  //       if (boredomTimerRef.current) {
  //         clearTimeout(boredomTimerRef.current);
  //         boredomTimerRef.current = null;
  //       }
  //     }
  //   };

  //   if (isVideoRunning) {
  //     checkAndConnectVoice();
  //   }
   
  
  //   // Cleanup on component unmount
  //   return () => {
  //     if (tirednessTimerRef.current) clearTimeout(tirednessTimerRef.current);
  //     if (contemplationTimerRef.current) clearTimeout(contemplationTimerRef.current);
  //     if (surpriseTimerRef.current) clearTimeout(surpriseTimerRef.current);
  //     if (boredomTimerRef.current) clearTimeout(boredomTimerRef.current);
  //   };
  // }, [emotions]); 


  return (
    <div className="mt-12">
      <div className="md:flex mt-20">
        <FaceTrackedVideo
          className="mb-6"
          onVideoReady={onVideoReady}
          trackedFaces={isVideoRunning ? trackedFaces : trackingFacesPlaceholder}
          width={500}
          height={375}
        />
        {!onCalibrate && (
          <div className="ml-10">
            <TopEmotions emotions={emotions} />
            <LoaderSet
              className="mt-8 ml-5"
              emotionNames={loaderNames}
              emotions={emotions}
              numLevels={numLoaderLevels}
            />
            <Descriptor className="mt-8" emotions={emotions} />
          </div>
        )}
      </div>

      <div className="pt-6">{status}</div>
      <canvas className="hidden" ref={photoRef}></canvas>


      <button onClick={toggleVideo} className="toggle-video-btn font-semibold text-center p-2 bg-gray-200 rounded border border-gray-400 shadow-lg">
        {isVideoRunning ? 'Stop Video' : 'Start Video'}
      </button>
    </div>
  );
}

FaceWidgets.defaultProps = {
  onCalibrate: None,
};