import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight, 
  Navigation, 
  Users, 
  Building, 
  CheckCircle,
  Star,
  Zap
} from "lucide-react";

const CTA = () => {
  const features = [
    "AI-Powered Route Optimization",
    "Accessibility-First Design",
    "Real-Time Updates",
    "Multi-Language Support",
    "Offline Navigation",
    "Enterprise Security"
  ];

  const benefits = [
    {
      icon: Users,
      title: "For Visitors",
      description: "Easy navigation for first-time visitors with intuitive guidance",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Building,
      title: "For Buildings",
      description: "Comprehensive management tools for building administrators",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: Navigation,
      title: "For Everyone",
      description: "Inclusive design that works for all users and abilities",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary/90 to-blue-600 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"
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
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"
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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Main CTA Content */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Zap className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">Ready to Transform Navigation?</span>
            </motion.div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Start Navigating Smarter
              <span className="block">Today</span>
            </h2>
            
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8">
              Join thousands of users who have already discovered the power of intelligent indoor navigation. 
              Experience the future of wayfinding with NaviGuide.
            </p>

            {/* Feature List */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-2 text-white/90"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0" />
                  <span className="text-sm font-medium">{feature}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 font-semibold px-8 py-4"
                  onClick={() => window.location.href = '/visitor/register'}
                >
                  Get Started Free
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
                  className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary font-semibold px-8 py-4"
                  onClick={() => window.location.href = '/navigation'}
                >
                  Try Demo
                  <Navigation className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Benefits Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            viewport={{ once: true }}
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <motion.div
                      className={`mx-auto mb-4 p-4 rounded-full w-fit ${benefit.bgColor}`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <benefit.icon className={`h-8 w-8 ${benefit.color}`} />
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-white/80 leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            viewport={{ once: true }}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto border border-white/20">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Trusted by Industry Leaders
                  </h3>
                  <p className="text-white/80">
                    Join 10,000+ users across 50+ countries
                  </p>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="flex items-center space-x-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <div className="text-sm text-white/80">4.9/5 Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">99.9%</div>
                    <div className="text-sm text-white/80">Uptime</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
