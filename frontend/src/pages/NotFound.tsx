import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- AnimalRunner Component (no changes) ---
interface AnimalRunnerProps {
  id: string;
  imageSrc: string;
  onComplete: (id: string) => void;
}

const AnimalRunner: React.FC<AnimalRunnerProps> = ({ id, imageSrc, onComplete }) => {
  const [direction, setDirection] = useState<'left' | 'right'>('left');

  useEffect(() => {
    setDirection(Math.random() > 0.5 ? 'left' : 'right');
  }, []);

  return (
    <motion.img
      key={id}
      src={imageSrc}
      alt="Cute running animal"
      className="absolute bottom-0 z-20 h-20 w-20"
      initial={{ 
        x: direction === 'left' ? -100 : window.innerWidth + 100,
        y: Math.random() * 50 + 50,
        rotateY: direction === 'left' ? 0 : 180,
        opacity: 0,
      }}
      animate={{ 
        x: direction === 'left' ? window.innerWidth + 100 : -100,
        opacity: [0, 1, 1, 0],
      }}
      transition={{ 
        duration: Math.random() * 5 + 4,
        ease: "linear",
      }}
      onAnimationComplete={() => onComplete(id)}
    />
  );
};

// --- GHOST COMPONENT MOVED HERE ---
interface GhostProps {
  easterEggActive: boolean;
}

const Ghost: React.FC<GhostProps> = ({ easterEggActive }) => (
  <motion.div
    animate={{
      translateY: easterEggActive ? ["0px", "-30px", "0px"] : ["0px", "-20px", "0px"],
      rotate: easterEggActive ? [0, 360] : 0,
    }}
    transition={{
      duration: easterEggActive ? 2 : 2.5,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    className="text-gray-400"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 2c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm-2 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-2 5c-2.336 0-4.35 1.513-5.013 3.554C7.75 18.418 9.73 19 12 19s4.25-.582 5.013-1.446C16.35 15.513 14.336 14 12 14z" />
    </svg>
  </motion.div>
);


// --- NotFound Component ---
const NotFound = () => {
  const location = useLocation();
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [runningAnimals, setRunningAnimals] = useState<{ id: string; src: string }[]>([]);
  
  // The rest of your logic remains the same...
  const animals = [
    "https://img.icons8.com/plasticine/100/null/cat.png",
    "https://img.icons8.com/plasticine/100/null/dog.png",
    "https://img.icons8.com/plasticine/100/null/rabbit.png",
    "https://img.icons8.com/plasticine/100/null/penguin.png",
  ];

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleGhostClick = () => {
    setEasterEggActive((prev) => {
      const isActivating = !prev;
      if (isActivating) {
        // Start spawning animals
        const interval = setInterval(() => {
          const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
          const newAnimal = { id: Math.random().toString(), src: randomAnimal };
          setRunningAnimals((currentAnimals) => [...currentAnimals, newAnimal]);
        }, 1500);
        // Store interval to clear it later
        (window as any).animalInterval = interval;
      } else {
        // Stop spawning and clear existing animals
        clearInterval((window as any).animalInterval);
        setRunningAnimals([]);
      }
      return isActivating;
    });
  };

  const handleAnimalComplete = (id: string) => {
    setRunningAnimals((prev) => prev.filter((animal) => animal.id !== id));
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-100">
      <AnimatePresence>
        {easterEggActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="animate-gradient absolute inset-0 z-0"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {runningAnimals.map((animal) => (
          <AnimalRunner
            key={animal.id}
            id={animal.id}
            imageSrc={animal.src}
            onComplete={handleAnimalComplete}
          />
        ))}
      </AnimatePresence>

      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* --- THIS IS THE CORRECTED PART --- */}
        <button onClick={handleGhostClick} className="cursor-pointer" aria-label="Activate easter egg">
          <Ghost easterEggActive={easterEggActive} />
        </button>
        {/* The rest of your JSX remains the same */}

        <motion.h1
          className={`mb-4 text-6xl font-bold transition-colors duration-500 ${
            easterEggActive ? 'text-white' : 'text-black'
          }`}
          animate={{ scale: easterEggActive ? [1, 1.1, 1] : 1 }}
          transition={{
            duration: easterEggActive ? 1 : 0,
            repeat: easterEggActive ? Infinity : 0,
          }}
        >
          404
        </motion.h1>

        <motion.p
          className={`mb-8 text-xl transition-colors duration-500 ${
            easterEggActive ? 'text-gray-200' : 'text-gray-600'
          }`}
        >
          Oops! You've discovered a secret place.
        </motion.p>
        
        <motion.a
          href="/"
          className={`rounded-md px-4 py-2 font-bold transition-all duration-300 ${
            easterEggActive
              ? 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
              : 'text-blue-500 underline hover:text-blue-700'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Return to Reality
        </motion.a>
      </motion.div>
    </div>
  );
};

export default NotFound;