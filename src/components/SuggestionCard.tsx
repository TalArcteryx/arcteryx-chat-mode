"use client";

import Image from "next/image";

interface SuggestionCardProps {
  imageUrl: string;
  title: string;
  description: string;
  onClick: () => void;
}

export default function SuggestionCard({ imageUrl, title, description, onClick }: SuggestionCardProps) {

  return (
    <button
      onClick={onClick}
      className="group relative w-full h-64 rounded-lg overflow-hidden border border-border hover:border-primary transition-all duration-300 hover:shadow-lg cursor-pointer"
    >
      <div className="relative w-full h-full">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {/* Overlay gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
          <h3 className="text-white text-xl font-bold mb-2">{title}</h3>
          <p className="text-white/90 text-sm">{description}</p>
        </div>
      </div>
    </button>
  );
}

