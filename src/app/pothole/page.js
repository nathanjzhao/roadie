"use client"
import { useEffect, useRef } from 'react';

export default function CameraStream() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let stream;

    async function setupCamera() {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
    }

    async function sendFramesToBackend() {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg');
        
        try {
          const response = await fetch('http://localhost:8000/api/process-frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData }),
          });
          
          if (response.ok) {
            const processedImageData = await response.json();
            // Draw the processed image with bounding boxes
            const img = new Image();
            img.onload = () => {
              context.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = processedImageData.image;
          }
        } catch (error) {
          console.error('Error sending frame to backend:', error);
        }
      }
      
      requestAnimationFrame(sendFramesToBackend);
    }

    setupCamera().then(() => {
      video.play();
      sendFramesToBackend();
    });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div>
      <h1>Live Camera Stream with Bounding Boxes</h1>
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} />
    </div>
  );
}