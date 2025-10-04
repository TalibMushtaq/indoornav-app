import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users, Building, MapPin, Clock } from "lucide-react";

const Stats = () => {
  const [counts, setCounts] = useState({
    users: 0,
    buildings: 0,
    landmarks: 0,
    routes: 0
  });

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const stats = [
    {
      icon: Users,
      value: 10000,
      label: "Active Users",
      suffix: "+",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Building,
      value: 500,
      label: "Buildings Mapped",
      suffix: "+",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: MapPin,
      value: 50000,
      label: "Landmarks Created",
      suffix: "+",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: Clock,
      value: 1000000,
      label: "Routes Calculated",
      suffix: "+",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  const animateCount = (start: number, end: number, duration: number, callback: (value: number) => void) => {
    const startTime = Date.now();
    const range = end - start;

    const updateCount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + range * easeOutQuart);
      
      callback(current);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  };

  useEffect(() => {
    if (isInView) {
      stats.forEach((stat, index) => {
        setTimeout(() => {
          animateCount(0, stat.value, 2000, (value) => {
            setCounts(prev => ({
              ...prev,
              [stat.label.toLowerCase().replace(/\s+/g, '')]: value
            }));
          });
        }, index * 200);
      });
    }
  }, [isInView]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-blue-500/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Trusted by Thousands
            <span className="block text-primary">Worldwide</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Our platform has helped millions of people navigate complex buildings with confidence. 
            See the numbers that speak to our success and reliability.
          </p>
        </motion.div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <motion.div
                className={`mx-auto mb-6 p-6 rounded-full w-fit ${stat.bgColor}`}
                whileHover={{ 
                  scale: 1.1,
                  rotate: 5
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <stat.icon className={`h-12 w-12 ${stat.color}`} />
              </motion.div>
              
              <motion.div
                className="text-4xl sm:text-5xl font-bold text-foreground mb-2"
                initial={{ scale: 0.5 }}
                whileInView={{ scale: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.2,
                  type: "spring",
                  stiffness: 200
                }}
                viewport={{ once: true }}
              >
                {formatNumber(counts[stat.label.toLowerCase().replace(/\s+/g, '') as keyof typeof counts])}
                <span className="text-primary">{stat.suffix}</span>
              </motion.div>
              
              <p className="text-lg font-semibold text-muted-foreground">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Additional Stats Info */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto border border-primary/10">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Growing Every Day
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              Our platform continues to expand with new buildings, features, and users joining our community daily. 
              We're committed to making indoor navigation accessible to everyone, everywhere.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-2">50+</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Stats;
