import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Shield, Accessibility, ArrowRight, CheckCircle } from "lucide-react";

const About = () => {
  const features = [
    {
      icon: MapPin,
      title: "Precise Navigation",
      description: "Get turn-by-turn directions to any location within buildings with pinpoint accuracy.",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Accessibility,
      title: "Accessibility First",
      description: "Wheelchair accessible routes, visual aids support, and hearing assistance compatibility.",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: Users,
      title: "Visitor Friendly",
      description: "Easy-to-use interface designed for first-time visitors and regular users alike.",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Your navigation data is secure with enterprise-grade security and privacy protection.",
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  ];

  const values = [
    "AI-Powered Route Optimization",
    "Real-Time Building Updates",
    "Multi-Language Support",
    "Emergency Exit Guidance",
    "Offline Navigation Capability",
    "Enterprise-Grade Security"
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
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            About NaviGuide
            <span className="block text-primary">Our Mission</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We're revolutionizing indoor navigation with cutting-edge technology that makes complex buildings 
            easy to navigate for everyone, everywhere.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
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
              <Card className="h-full text-center hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="pb-4">
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
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* About Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold text-foreground mb-6">
              Simplifying Indoor Navigation
            </h3>
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p className="text-lg">
                NaviGuide was born from the frustration of getting lost in large, complex buildings. 
                Whether you're visiting a hospital, university campus, shopping mall, or office complex, 
                our system provides clear, step-by-step directions to your destination.
              </p>
              <p>
                Our platform supports multiple building types and floor layouts, with real-time updates 
                and alternative route suggestions. We prioritize accessibility and ensure that everyone 
                can navigate confidently, regardless of their mobility needs.
              </p>
              <p>
                With features like landmark recognition, emergency exit guidance, and multi-language 
                support, NaviGuide is the comprehensive solution for modern indoor navigation challenges.
              </p>
            </div>
            
            {/* Values List */}
            <motion.div 
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h4 className="text-xl font-semibold text-foreground mb-4">What We Offer:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {values.map((value, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center space-x-2"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{value}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
          
          {/* About Image with Animation */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.div 
              className="rounded-2xl aspect-square overflow-hidden border shadow-2xl"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img 
                src="https://ndoornav-app-bucket.s3.ap-south-1.amazonaws.com/indooranav-app-public-assets/aboutImage-hero.jpg" 
                alt="Team collaborating on the NaviGuide mission"
                className="w-full h-full object-cover"
              />
            </motion.div>
            
            {/* Floating Elements */}
            <motion.div
              className="absolute -top-4 -right-4 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center"
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <MapPin className="h-6 w-6 text-primary" />
            </motion.div>
            <motion.div
              className="absolute -bottom-4 -left-4 w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center"
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
            >
              <Users className="h-5 w-5 text-green-600" />
            </motion.div>
          </motion.div>
        </div>

        {/* Call to Action */}
        <motion.div 
          className="text-center bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-2xl p-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Ready to Experience the Future of Navigation?
          </h3>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of users who have already discovered the power of intelligent indoor navigation. 
            Start your journey with NaviGuide today.
          </p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => window.location.href = '/visitor/register'}
              >
                Get Started Now
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
                onClick={() => window.location.href = '/navigation'}
              >
                Try Demo
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;