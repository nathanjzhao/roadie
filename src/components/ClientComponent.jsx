"use client";
import React, { useState, useEffect } from "react";
import { VoiceProvider } from "@humeai/voice-react";
import Messages from "./Controls";
import Controls from "./Messages";
import Cookies from 'js-cookie';

export default function ClientComponent({ accessToken }) {

  const [resumedGroupChatId, setResumedGroupChatId] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false); // State to track data loading

  useEffect(() => {
    const messageWithIds = Cookies.get('messageWithIds');
    console.log(messageWithIds)
    if (messageWithIds) {
      const { chat_group_id } = JSON.parse(messageWithIds);
      setResumedGroupChatId(chat_group_id);
    }
    setIsDataLoaded(true); // Set data loaded to true after operation
  }, []);

  // if (!isDataLoaded) {
  //   return <div>Loading...</div>; // Or any other loading indicator
  // }

  return (
    <VoiceProvider 
      auth={{ type: "accessToken", value: accessToken }}
      configId={process.env.NEXT_PUBLIC_HUME_CONFIG_ID}
      resumedGroupChatId={resumedGroupChatId}
    >
      {/* {resumedGroupChatId} */}
      <Messages />
      <Controls />
    </VoiceProvider>
  );
}
