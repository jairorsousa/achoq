"use client";

import { motion } from "framer-motion";

const AVATARS = [
  { id: "lion", emoji: "🦁" },
  { id: "fox", emoji: "🦊" },
  { id: "penguin", emoji: "🐧" },
  { id: "panda", emoji: "🐼" },
  { id: "tiger", emoji: "🐯" },
  { id: "frog", emoji: "🐸" },
  { id: "bear", emoji: "🐻" },
  { id: "koala", emoji: "🐨" },
  { id: "dog", emoji: "🐶" },
  { id: "cat", emoji: "🐱" },
  { id: "monkey", emoji: "🐵" },
  { id: "robot", emoji: "🤖" },
];

interface AvatarPickerProps {
  selected: string;
  onSelect: (id: string) => void;
}

export default function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {AVATARS.map((av) => (
        <motion.button
          key={av.id}
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(av.id)}
          className={[
            "w-full aspect-square flex items-center justify-center text-3xl rounded-3xl border-2 transition-all",
            selected === av.id
              ? "border-primary bg-primary/10 shadow-btn-primary scale-110"
              : "border-gray-200 bg-white hover:border-primary/40",
          ].join(" ")}
        >
          {av.emoji}
        </motion.button>
      ))}
    </div>
  );
}

export { AVATARS };
