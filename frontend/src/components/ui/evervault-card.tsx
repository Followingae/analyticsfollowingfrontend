"use client";
import { useMotionValue } from "framer-motion";
import React, { useState, useEffect } from "react";
import { useMotionTemplate, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const EvervaultCard = ({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) => {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  const [randomString, setRandomString] = useState("");
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const generateDynamicString = () => {
      if (!containerRef) return generateRandomString(3000);
      
      const { width, height } = containerRef.getBoundingClientRect();
      // Calculate names needed based on container dimensions
      // 11px font, 14px line height, ~50px avg name width (7 chars * 7px)
      const namesPerLine = Math.floor((width - 8) / 50); // Account for padding, avg name width
      const linesNeeded = Math.ceil((height - 8) / 14); // Account for padding
      const totalNames = Math.floor(namesPerLine * linesNeeded * 2.5); // Increased density to fill the box
      
      console.log('Dynamic sizing:', { width, height, namesPerLine, linesNeeded, totalNames });
      
      return generateRandomString(Math.max(totalNames * 8, 2500)); // 8 chars per name avg (including spaces) - higher minimum
    };

    let str = generateDynamicString();
    setRandomString(str);

    // Regenerate on resize
    const handleResize = () => {
      setRandomString(generateDynamicString());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [containerRef]);

  function onMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    let { left, top } = currentTarget.getBoundingClientRect();
    // Use clientX/Y which are relative to viewport, not affected by scroll
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);

    // Generate new text based on current container size
    const generateDynamicString = () => {
      if (!containerRef) return generateRandomString(3000);
      
      const { width, height } = containerRef.getBoundingClientRect();
      const namesPerLine = Math.floor(width / 50); // ~50px avg name width  
      const linesNeeded = Math.ceil(height / 14);
      const totalNames = Math.floor(namesPerLine * linesNeeded * 2.5); // Increased density to fill the box
      
      return generateRandomString(Math.max(totalNames * 8, 2000)); // 8 chars per name avg
    };

    const str = generateDynamicString();
    setRandomString(str);
  }

  return (
    <div
      ref={setContainerRef}
      className={cn(
        "bg-background w-full h-full relative overflow-hidden",
        className
      )}
    >
      <div
        onMouseMove={onMouseMove}
        className="group/card w-full relative overflow-hidden bg-background h-full"
      >
        <CardPattern
          mouseX={mouseX}
          mouseY={mouseY}
          randomString={randomString}
        />
        {text && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="relative flex items-center justify-center">
              <span className="text-white font-bold text-6xl opacity-20">{text}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const CardPattern = ({ mouseX, mouseY, randomString }: any) => {
  const maskImage = useMotionTemplate`radial-gradient(500px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage };
  
  return (
    <div className="pointer-events-none">
      {/* Background names layer */}
      <div className="absolute inset-0 opacity-20 p-1">
        <div className="w-full h-full overflow-hidden">
          <p className="text-[11px] leading-[14px] break-all whitespace-pre-wrap text-muted-foreground/60 font-mono font-bold w-full h-full overflow-hidden">
            {randomString}
          </p>
        </div>
      </div>


      {/* Purple gradient overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-violet-600/30 opacity-0 group-hover/card:opacity-100 transition duration-500"
        style={style}
      />

      {/* Interactive names layer - no scaling */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition duration-500 p-1"
        style={style}
      >
        <div className="w-full h-full overflow-hidden">
          <p className="text-[11px] leading-[14px] break-all whitespace-pre-wrap text-purple-600 font-mono font-bold w-full h-full overflow-hidden">
            {randomString}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const names = [
  "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "William",
  "Charlotte", "James", "Amelia", "Benjamin", "Mia", "Lucas", "Harper", "Henry", "Evelyn", "Alexander",
  "Abigail", "Michael", "Emily", "Elijah", "Elizabeth", "Daniel", "Avery", "Matthew", "Sofia", "Aiden",
  "Ella", "Jackson", "Madison", "David", "Scarlett", "Joseph", "Victoria", "Samuel", "Aria", "Carter",
  "Grace", "Owen", "Chloe", "Wyatt", "Camila", "John", "Penelope", "Jack", "Riley", "Luke",
  "Layla", "Jayden", "Lillian", "Dylan", "Nora", "Grayson", "Zoey", "Levi", "Mila", "Isaac",
  "Aubrey", "Gabriel", "Hannah", "Julian", "Lily", "Mateo", "Addison", "Anthony", "Eleanor", "Jaxon",
  "Natalie", "Lincoln", "Luna", "Joshua", "Savannah", "Christopher", "Brooklyn", "Andrew", "Leah", "Theodore",
  "Zoe", "Caleb", "Stella", "Ryan", "Hazel", "Asher", "Ellie", "Nathan", "Paisley", "Thomas",
  "Audrey", "Leo", "Skylar", "Isaiah", "Violet", "Charles", "Claire", "Josiah", "Bella", "Angel",
  "Aurora", "Colin", "Lucy", "Hunter", "Anna", "Eli", "Samantha", "Jonathan", "Caroline", "Connor",
  "Genesis", "Landon", "Aaliyah", "Adrian", "Kennedy", "Cameron", "Kinsley", "Santiago", "Allison", "Mason",
  "Maya", "Nolan", "Sarah", "Roman", "Madelyn", "Ford", "Adeline", "Jason", "Alexa", "Easton",
  "Ariana", "Aaron", "Elena", "Jaxson", "Gabriella", "Miles", "Naomi", "Walker", "Alice", "Adam",
  "Sadie", "Jeremiah", "Hailey", "Jordan", "Eva", "Nicholas", "Emilia", "Evan", "Autumn", "Wesley",
  "Quinn", "Greyson", "Nevaeh", "Jose", "Piper", "Jace", "Ruby", "Jameson", "Serenity", "Leonardo",
  "Willow", "Bryson", "Everly", "Axel", "Cora", "Everett", "Kaylee", "Parker", "Lydia", "Kayden",
  "Aubree", "Miles", "Arianna", "Sawyer", "Eliana", "Jason", "Peyton", "Declan", "Melanie", "Robert",
  "Gianna", "Carson", "Isabelle", "Maverick", "Julia", "Brayden", "Valentina", "Felix", "Nova", "Micah",
  "Clara", "Ryder", "Vivian", "Blake", "Reagan", "Carlos", "Mackenzie", "Maxwell", "Madeline", "Coopers",
  "Brielle", "Lorenzo", "Delilah", "Jayce", "Isla", "Kevin", "Rylee", "Luis", "Katherine", "Tristan",
  "Josephine", "Nathaniel", "Ivy", "Colton", "Liliana", "Juan", "Remi", "Dominic", "Jade", "Devin",
  "Maria", "Kenneth", "Ximena", "Jude", "Brynlee", "Braxton", "Harmony", "Jose", "Phoenix", "Abel",
  "Raelynn", "Rowan", "Jordyn", "Louis", "Rose", "Kaden", "Eloise", "Bentley", "Adalynn", "Victor",
  "Emery", "Maddox", "Leilani", "Patrick", "Adalyn", "Tucker", "Arya", "Leon", "Emersyn", "Ellis",
  "Lexi", "Dean", "Sienna", "Paul", "Natalia", "Edward", "Paris", "Oscar", "Maggie", "George",
  "Kinley", "Hayden", "Ana", "Damian", "Norah", "Austin", "Lyla", "Ivan", "Reese", "Mark",
  "Paige", "Ashton", "Rachel", "Jesus", "Valerie", "Camden", "Daisy", "Timothy", "Naomi", "Ian",
  "Jessica", "Cooper", "Eliza", "Diego", "Rebecca", "Fabian", "Gemma", "Peter", "Kaia", "Abraham",
  "Alina", "Alex", "Mckenzie", "Richard", "Sage", "Sean", "Alyssa", "Giovanni", "Luna", "Alan",
  "Juliana", "Kaiden", "Rosalie", "Luka", "Trinity", "Wayne", "Jasmine", "Giovanni", "Anastasia", "Brody",
  "Zara", "Emmanuel", "Londyn", "Malcolm", "Savanna", "Myles", "Aspen", "Griffin", "Lucia", "Aidan",
  "Lilly", "Harrison", "Ariel", "Frederick", "Cecilia", "Antonio", "Diana", "Finn", "Sydney", "Arthur"
];

export const generateRandomString = (length: number) => {
  let result = "";
  const words = Math.ceil(length / 6); // Average name length ~6 chars
  
  for (let i = 0; i < words; i++) {
    const name = names[Math.floor(Math.random() * names.length)];
    result += name;
    
    // Add space between names, but not after the last one
    if (i < words - 1) {
      result += " ";
    }
  }
  
  return result.substring(0, length); // Trim to exact length if needed
};

export const Icon = ({ className, ...rest }: any) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};