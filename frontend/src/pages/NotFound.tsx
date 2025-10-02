import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Orb from "../components/Orb"; // Adjust the import path if you saved Orb elsewhere

// --- Ghost Component ---
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


// --- Main NotFound Component ---
const NotFound = () => {
  const location = useLocation();
  const [easterEggActive, setEasterEggActive] = useState(false);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleGhostClick = () => {
    setEasterEggActive((prev) => !prev);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black">
      
      <div className="absolute inset-0 z-0">
        <Orb
          hoverIntensity={0.5}
          rotateOnHover={true}
          forceHoverState={easterEggActive}
        />
      </div>

      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <button onClick={handleGhostClick} className="cursor-pointer" aria-label="Activate easter egg">
          <Ghost easterEggActive={easterEggActive} />
        </button>

        <motion.h1
          className="mb-4 text-6xl font-bold text-white"
          animate={{ scale: easterEggActive ? [1, 1.1, 1] : 1 }}
          transition={{
            duration: easterEggActive ? 1 : 0,
            repeat: easterEggActive ? Infinity : 0,
          }}
        >
          404
        </motion.h1>

        {/* --- TEXT CHANGED HERE --- */}
        <motion.p className="mb-8 text-xl text-gray-200">
          Lost in the cosmos?
        </motion.p>
        
        <motion.a
          href="/"
          className="rounded-md bg-white bg-opacity-20 px-4 py-2 font-bold text-white transition-all duration-300 hover:bg-opacity-30"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* --- TEXT CHANGED HERE --- */}
          Return to Earth
        </motion.a>
      </motion.div>

      <motion.p
        className="absolute bottom-4 right-4 text-sm text-gray-300"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        Designed by Talib
      </motion.p>
    </div>
  );
};

export default NotFound;