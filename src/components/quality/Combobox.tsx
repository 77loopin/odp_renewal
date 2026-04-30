"use client";
import { useState, useRef, useEffect } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Enter 키를 누르면 호출. 호출 직전 드롭다운은 자동 닫힘. */
  onEnter?: () => void;
}

export default function Combobox({ value, onChange, options, placeholder, className = "", disabled, onEnter }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = value
    ? options.filter((o) => o.toLowerCase().includes(value.toLowerCase()))
    : options;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setOpen(false);
            onEnter?.();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-100"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {filtered.slice(0, 100).map((opt) => (
            <li
              key={opt}
              onMouseDown={(e) => { e.preventDefault(); onChange(opt); setOpen(false); }}
              className="px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer"
            >{opt}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
