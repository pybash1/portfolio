import { useEffect, useState, useRef } from "react";

interface Props {
  text: string;
  speed?: number;
  chars?: string;
  className?: string;
}

export default function ScrambleText({
  text,
  speed = 100,
  chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?",
  className = "",
}: Props) {
  const [displayText, setDisplayText] = useState(text);
  const iterationRef = useRef<number>(0);
  const encryptOrderRef = useRef<number[]>([]);
  const decryptOrderRef = useRef<number[]>([]);

  useEffect(() => {
    const textLength = text.length;
    
    // Create randomized order for encrypting and decrypting
    const createRandomOrder = () => {
      const indices = Array.from({ length: textLength }, (_, i) => i).filter(i => text[i] !== " ");
      return indices.sort(() => Math.random() - 0.5);
    };
    
    encryptOrderRef.current = createRandomOrder();
    decryptOrderRef.current = createRandomOrder();
    
    const totalCycle = textLength * 2; // Encrypt + Decrypt

    const interval = setInterval(() => {
      const iteration = iterationRef.current;

      setDisplayText(() =>
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            
            // Phase 1: Encrypting (0 to textLength)
            if (iteration < textLength) {
              // Check if this character should be encrypted based on random order
              const encryptedIndices = encryptOrderRef.current.slice(0, iteration);
              if (encryptedIndices.includes(index)) {
                return chars[Math.floor(Math.random() * chars.length)];
              }
              return char;
            }
            
            // Phase 2: Decrypting (textLength to textLength * 2)
            const decryptProgress = iteration - textLength;
            // Check if this character should be decrypted based on random order
            const decryptedIndices = decryptOrderRef.current.slice(0, decryptProgress);
            if (decryptedIndices.includes(index)) {
              return char;
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      iterationRef.current += 1;

      // Reset and loop the animation
      if (iterationRef.current >= totalCycle) {
        iterationRef.current = 0;
        // Generate new random orders for the next cycle
        encryptOrderRef.current = createRandomOrder();
        decryptOrderRef.current = createRandomOrder();
      }
    }, speed);

    return () => {
      clearInterval(interval);
    };
  }, [text, speed, chars]);

  return <span className={`inline-block ${className}`}>{displayText}</span>;
}
