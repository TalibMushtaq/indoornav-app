import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Navigation, MapPin, Users, Clock, Shield } from "lucide-react";

const Hero = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  
  const features = [
    { icon: MapPin, text: "Precise Indoor Navigation" },
    { icon: Users, text: "Visitor-Friendly Interface" },
    { icon: Clock, text: "Real-Time Guidance" },
    { icon: Shield, text: "Secure & Reliable" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="home" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Hero Icon with Animation */}
          <motion.div 
            className="mb-8 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className="p-4 bg-primary/10 rounded-full"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Navigation className="h-16 w-16 text-primary" />
            </motion.div>
          </motion.div>
          
          {/* Hero Text with Staggered Animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Navigate Any Building
              </motion.span>
              <motion.span 
                className="block text-primary"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                With Confidence
              </motion.span>
            </h1>
          </motion.div>
          
          <motion.p 
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Our intelligent indoor navigation system helps you find your way through complex buildings with turn-by-turn directions, accessibility options, and real-time guidance.
          </motion.p>
          
          {/* Animated Feature Rotator */}
          <motion.div 
            className="mb-8 flex justify-center"
            key={currentFeature}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full">
              {(() => {
                const { icon: FeatureIcon, text } = features[currentFeature];
                return (
                  <>
                    <FeatureIcon className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-primary">{text}</span>
                  </>
                );
              })()}
            </div>
          </motion.div>
          
          {/* CTA Buttons with Animation */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                onClick={() => window.location.href = '/visitor/register'}
              >
                Navigate as Visitor
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => window.location.href = '/navigation'}
              >
                Try Navigation
                <Navigation className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Responsive Hero Image with Animation */}
          <motion.div 
            className="mt-12 relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <motion.div 
              className="max-w-4xl mx-auto border bg-background rounded-lg p-2 shadow-2xl"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <picture>
                <source
                  media="(min-width: 640px)"
                  srcSet="https://ndoornav-app-bucket.s3.ap-south-1.amazonaws.com/indooranav-app-public-assets/heroplaceholder.jpg"
                />
                <img
                  src="https://ndoornav-app-bucket.s3.ap-south-1.amazonaws.com/indooranav-app-public-assets/heromob.jpg"
                  alt="Interactive Building Map Preview"
                  className="rounded-md w-full"
                />
              </picture>
            </motion.div>
            
            {/* Floating Elements */}
            <motion.div
              className="absolute -top-4 -right-4 w-8 h-8 bg-primary/20 rounded-full"
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-500/20 rounded-full"
              animate={{
                y: [0, 10, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;