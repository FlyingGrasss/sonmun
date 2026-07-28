// components/Countdown.tsx

"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const calculateTimeLeft = (targetDate: number): TimeLeft => {
  const now = new Date().getTime();
  const difference = targetDate - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
  };
};

const TimeUnit = ({ value, label, isMounted }: { value: number; label: string; isMounted: boolean }) => (
  <div className="flex flex-col items-center">
    <div className="flex items-center justify-center bg-white text-[var(--background)] rounded-lg px-6 py-4 min-w-[100px] max-sm:min-w-20 max-sm:px-4 max-sm:py-3 shadow-lg">
      <span className="text-center text-5xl max-sm:text-4xl font-bold tabular-nums">
        {!isMounted ? "00" : value.toString().padStart(2, "0")}
      </span>
    </div>
    <span className="text-white text-lg max-sm:text-base mt-2 uppercase tracking-wider">
      {label}
    </span>
  </div>
);

const Countdown = ({ startDateIso }: { startDateIso: string }) => {
  const targetDate = new Date(startDateIso).getTime();
  // 1. Initialize with a "safe" default state that will be the same on Server and Client
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // 2. Track if the component has mounted
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // 3. Set the initial time and mark as mounted once we are on the client
    setIsMounted(true);
    setTimeLeft(calculateTimeLeft(targetDate));

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-4 max-sm:gap-2 justify-center">
      <TimeUnit value={timeLeft.days} label="Days" isMounted={isMounted} />
      <TimeUnit value={timeLeft.hours} label="Hours" isMounted={isMounted} />
      <TimeUnit value={timeLeft.minutes} label="Minutes" isMounted={isMounted} />
      <TimeUnit value={timeLeft.seconds} label="Seconds" isMounted={isMounted} />
    </div>
  );
};

export default Countdown;
