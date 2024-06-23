// ./components/Messages.tsx
"use client";
import { useVoice } from "@humeai/voice-react";

export default function Messages() {
  const { messages } = useVoice();

  return (
    <div className="flex flex-col">
      {messages.map((msg, index) => {
        if (msg.type === "user_message") {
          const updatedContent = msg.message.content.replace(/Rody|Rudy|roadie|Rhodey|Roni/g, "Roadie");
          return (
            <div key={msg.type + index} className="self-start bg-purple-100 p-2 rounded-md inline-block max-w-[600px] break-words mr-20 mb-2">
              <div className="font-semibold bg-purple-200">{"You"}</div>
              <div className="bg-purple-200">{updatedContent}</div>
            </div>
          );
        }
        if (msg.type === "assistant_message") {
          const updatedContent = msg.message.content.replace(/Rody|Rudy|roadie|Rhodey|Roni/g, "Roadie");
          return (
            <div key={msg.type + index} className="self-end bg-blue-400 p-2 rounded-md inline-block max-w-[600px] break-words ml-20 mb-2">
              <div className="font-semibold bg-blue-500">{"Assistant Roadie"}</div>
              <div className="font-medium bg-blue-500">{updatedContent}</div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
