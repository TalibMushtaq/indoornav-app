import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MapPin, 
  Users, 
  Shield, 
  Accessibility, 
  Clock, 
  Smartphone,
  Zap,
  Globe
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: MapPin,
      title: "Precise Indoor Navigation",
      description: "Advanced pathfinding algorithms provide accurate turn-by-turn directions within complex building layouts.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      delay: 0.1
    },
    {
      icon: Accessibility,
      title: "Accessibility First",
      description: "Wheelchair accessible routes, visual aids support, and hearing assistance compatibility for inclusive navigation.",
      color: "text-green-600",
      bgColor: "bg-green-50",
      delay: 0.2
    },
    {
      icon: Users,
      title: "Visitor Friendly",
      description: "Intuitive interface designed for first-time visitors with clear visual guidance and easy-to-follow instructions.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      delay: 0.3
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with privacy protection and reliable service uptime for all your navigation needs.",
      color: "text-red-600",
      bgColor: "bg-red-50",
      delay: 0.4
    },
    {
      icon: Clock,
      title: "Real-Time Updates",
      description: "Live building information with real-time updates on closures, maintenance, and alternative routes.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      delay: 0.5
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Responsive design that works perfectly on all devices with offline capabilities for uninterrupted navigation.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      delay: 0.6
    },
    {
      icon: Zap,
      title: "AI-Powered",
      description: "Smart route optimization using artificial intelligence to find the most efficient paths and avoid congestion.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      delay: 0.7
    },
    {
      icon: Globe,
      title: "Multi-Language",
      description: "Support for multiple languages and cultural preferences to serve diverse global audiences.",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      delay: 0.8
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Powerful Features for
            <span className="block text-primary">Every Navigation Need</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover the comprehensive set of features that make NaviGuide the most advanced 
            indoor navigation solution for modern buildings and complex environments.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              transition={{ duration: 0.6, ease: "easeOut" }}
              whileHover={{ 
                y: -5,
                transition: { duration: 0.2 }
              }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="text-center pb-4">
                  <motion.div
                    className={`mx-auto mb-4 p-4 rounded-full w-fit ${feature.bgColor}`}
                    whileHover={{ 
                      scale: 1.1,
                      rotate: 5
                    }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </motion.div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-base leading-relaxed text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Info Section */}
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Ready to Experience Advanced Navigation?
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              Join thousands of users who trust NaviGuide for their indoor navigation needs. 
              From hospitals to shopping malls, we make complex buildings simple to navigate.
            </p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <motion.button
                className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/visitor/register'}
              >
                Get Started Now
              </motion.button>
              <motion.button
                className="px-8 py-3 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/navigation'}
              >
                Try Demo
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
