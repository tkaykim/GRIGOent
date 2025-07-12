import React from "react";

interface ArtistSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const ArtistSection: React.FC<ArtistSectionProps> = ({ title, children, className }) => (
  <section className={`my-8 px-4 max-w-2xl mx-auto ${className || ""}`}>
    <h2 className="text-xl md:text-2xl font-bold text-red-500 mb-3 tracking-tight">{title}</h2>
    <div className="bg-white/5 rounded-xl p-4 shadow-md text-white">{children}</div>
  </section>
);

export default ArtistSection; 