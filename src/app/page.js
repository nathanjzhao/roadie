// ./app/page.tsx
"use client";
import ClientComponent from "@/components/ClientComponent";
import { fetchAccessToken } from "@humeai/voice";

export default async function Home() {
  const accessToken = await fetchAccessToken({
    apiKey: String(process.env.NEXT_PUBLIC_HUME_API_KEY),
    secretKey: String(process.env.NEXT_PUBLIC_HUME_SECRET_KEY),
  });

  if (!accessToken) {
    throw new Error();
  }

  return (
    <>
      <ClientComponent accessToken={accessToken} />
    </>
  );
}
