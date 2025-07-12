"use client";

import React, { useState } from "react";

interface Media {
  type: "image" | "video";
  url: string;
}

interface ArtistMediaSliderProps {
  media: Media[];
}

const ArtistMediaSlider: React.FC<ArtistMediaSliderProps> = ({ media }) => {
  const safeMedia = Array.isArray(media) ? media : [];
  const [current, setCurrent] = useState(0);
  const goTo = (idx: number) => setCurrent(idx);
  if (safeMedia.length === 0) return null;
  return (
    <div className="relative w-full max-w-2xl mx-auto aspect-square overflow-hidden rounded-xl bg-black">
      {safeMedia.map((item, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-500 ${idx === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
        >
          {item.type === "image" ? (
            <img src={item.url} alt="artist media" className="w-full h-full object-cover" />
          ) : (
            <video src={item.url} autoPlay loop muted className="w-full h-full object-cover" />
          )}
        </div>
      ))}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {safeMedia.map((_, idx) => (
          <button
            key={idx}
            className={`w-3 h-3 rounded-full border border-white ${idx === current ? "bg-white" : "bg-white/30"}`}
            onClick={() => goTo(idx)}
            aria-label={`슬라이드 ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ArtistMediaSlider; 