import React, { useState } from 'react';

interface ColorSwatchProps {
  name: string;
  category: string;
  hex: string;
  rgb?: string;
  twClass: string;
  textColor?: string;
  onCopy: (value: string, label: string) => void;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  name,
  category,
  hex,
  rgb,
  twClass,
  textColor = 'text-white',
  onCopy,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (value: string, label: string) => {
    onCopy(value, label);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <div className="bg-[#141414]/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all duration-300 group">
      {/* Sample visual card */}
      <div
        className={`w-full h-24 rounded-xl border border-white/10 shadow-inner flex items-center justify-center p-3 relative overflow-hidden transition-transform duration-300 group-hover:scale-[1.02] ${twClass}`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
        <span className={`font-cinzel text-xs font-bold tracking-widest uppercase drop-shadow-md z-10 ${textColor}`}>
          {name}
        </span>
      </div>

      {/* Info & Details */}
      <div className="mt-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-white/40 font-medium">
            {category}
          </span>
          <span className="text-[9px] font-mono text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
            {twClass.split(' ')[0]}
          </span>
        </div>

        {/* Values and Copy Actions */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={() => handleCopy(hex, `${name} (HEX)`)}
            className="flex items-center justify-between bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:border-amber-500/30 transition-colors text-left group/btn"
            title="Clique para copiar HEX"
          >
            <span className="text-[11px] font-mono text-white/80 group-hover/btn:text-amber-300 font-medium">
              {hex}
            </span>
            <span className="text-[9px] font-sans uppercase tracking-wider text-white/30 group-hover/btn:text-amber-300">
              {copiedField === `${name} (HEX)` ? '✓' : 'HEX'}
            </span>
          </button>

          <button
            onClick={() => handleCopy(twClass, `${name} (Classe)`)}
            className="flex items-center justify-between bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 hover:bg-white/10 hover:border-amber-500/30 transition-colors text-left group/btn"
            title="Clique para copiar Classe Tailwind"
          >
            <span className="text-[10px] font-mono text-white/70 truncate mr-1 group-hover/btn:text-amber-300 font-medium">
              {twClass}
            </span>
            <span className="text-[9px] font-sans uppercase tracking-wider text-white/30 group-hover/btn:text-amber-300 shrink-0">
              {copiedField === `${name} (Classe)` ? '✓' : 'CSS'}
            </span>
          </button>
        </div>

        {rgb && (
          <button
            onClick={() => handleCopy(rgb, `${name} (RGB)`)}
            className="w-full mt-0.5 text-left bg-black/20 hover:bg-black/50 border border-white/5 rounded-lg px-2.5 py-1 text-[10px] font-mono text-white/40 hover:text-white/80 transition-colors flex items-center justify-between"
          >
            <span>{rgb}</span>
            <span className="text-[8px] uppercase tracking-wider">RGB</span>
          </button>
        )}
      </div>
    </div>
  );
};
