import { useState, useEffect } from 'react';

export default function useConsistentPresence(array: any[], target: any, duration: number = 30000) {
  const [isConsistentlyPresent, setIsConsistentlyPresent] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (array.includes(target)) {
      if (startTime === null) {
        setStartTime(Date.now());
      } else if (Date.now() - startTime >= duration) {
        setIsConsistentlyPresent(true);
      }
    } else {
      setStartTime(null);
      setIsConsistentlyPresent(false);
    }

    timer = setTimeout(() => {
      // This will trigger the effect to run again after 100ms
    }, 100);

    return () => clearTimeout(timer);
  }, [array, target, duration, startTime]);

  return isConsistentlyPresent;
}