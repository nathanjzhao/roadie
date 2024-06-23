// ./components/Messages.tsx
"use client";
import { useVoice } from "@humeai/voice-react";

export default function Messages() {
  const { messages } = useVoice();

  return (
    <div className="flex flex-col px-4">
      {messages.map((msg, index) => {
        if (msg.type === "user_message") {
          const updatedContent = msg.message.content.replace(/Rody|Rudy|roadie|Rhodey|Roni/g, "Roadie");
          return (
            <div key={msg.type + index} className="self-start bg-purple-100 p-2 rounded-md inline-block max-w-[600px] break-words mr-20 mb-2">
            <div className="font-medium p-2 bg-purple-200 rounded-md">
              <strong>{"You"}</strong>  <br/>
              {updatedContent}</div>
            </div>
          );
        }
        if (msg.type === "assistant_message") {
          const updatedContent = msg.message.content.replace(/Rody|Rudy|roadie|Rhodey|Roni/g, "Roadie");
          return (
            <div key={msg.type + index} className="self-end bg-blue-400 p-2 rounded-md inline-block max-w-[600px] break-words ml-20 mb-2">
              <div className="font-medium p-2 bg-blue-500 rounded-md">
              <strong>{"Assistant Roadie"}</strong><br/>
                {updatedContent}</div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
