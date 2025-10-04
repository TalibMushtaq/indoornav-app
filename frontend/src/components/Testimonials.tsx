import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoplayRef = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Hospital Administrator",
      company: "City General Hospital",
      content: "NaviGuide has transformed how our patients and visitors navigate our complex hospital campus. The accessibility features are outstanding, and the real-time updates help us manage traffic flow efficiently.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Michael Chen",
      role: "Mall Manager",
      company: "Westfield Shopping Center",
      content: "Our customer satisfaction scores have improved significantly since implementing NaviGuide. Visitors can easily find stores, restrooms, and exits without getting lost. It's a game-changer for retail navigation.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "University Professor",
      company: "Metropolitan University",
      content: "As someone who uses a wheelchair, NaviGuide's accessibility features are incredible. It shows me the most accessible routes and helps me navigate our campus independently. This technology is truly inclusive.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "James Wilson",
      role: "Corporate Facilities Manager",
      company: "TechCorp Headquarters",
      content: "The AI-powered route optimization saves our employees time every day. The system learns from usage patterns and suggests the most efficient paths. It's like having a personal navigation assistant.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Lisa Thompson",
      role: "Airport Operations Director",
      company: "International Airport",
      content: "Managing passenger flow in our busy airport is challenging, but NaviGuide helps us direct people efficiently. The multi-language support is fantastic for our international travelers.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "David Park",
      role: "Museum Curator",
      company: "Art & Science Museum",
      content: "Visitors can now explore our museum exhibits in a logical flow thanks to NaviGuide. The interactive features help them discover hidden gems and plan their visit efficiently.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
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
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            What Our Users Say
            <span className="block text-primary">About NaviGuide</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Don't just take our word for it. Hear from real users who have experienced 
            the power of intelligent indoor navigation in their daily lives.
          </p>
        </motion.div>

        <motion.div
          className="max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Carousel
            plugins={[autoplayRef.current]}
            className="w-full"
            onSelect={(index) => setCurrentIndex(index || 0)}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <motion.div 
                    variants={itemVariants}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                      <CardContent className="p-6 h-full flex flex-col">
                        {/* Quote Icon */}
                        <div className="mb-4">
                          <Quote className="h-8 w-8 text-primary/60" />
                        </div>
                        
                        {/* Rating */}
                        <div className="flex mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        
                        {/* Content */}
                        <p className="text-muted-foreground mb-6 flex-grow leading-relaxed">
                          "{testimonial.content}"
                        </p>
                        
                        {/* Author */}
                        <div className="flex items-center space-x-3">
                          <img
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-semibold text-foreground">
                              {testimonial.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {testimonial.role}
                            </div>
                            <div className="text-sm text-primary font-medium">
                              {testimonial.company}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Navigation Buttons */}
            <div className="flex justify-center space-x-4 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : testimonials.length - 1;
                  setCurrentIndex(prevIndex);
                }}
                className="hover:bg-primary hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const nextIndex = currentIndex < testimonials.length - 1 ? currentIndex + 1 : 0;
                  setCurrentIndex(nextIndex);
                }}
                className="hover:bg-primary hover:text-white transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Carousel>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto border border-primary/10">
            <h3 className="text-2xl font-bold text-foreground mb-6">
              Trusted by Industry Leaders
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
              <div className="text-center">
                <div className="text-sm font-semibold text-muted-foreground">Healthcare</div>
                <div className="text-xs text-muted-foreground">50+ Hospitals</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-muted-foreground">Retail</div>
                <div className="text-xs text-muted-foreground">100+ Malls</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-muted-foreground">Education</div>
                <div className="text-xs text-muted-foreground">200+ Universities</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-muted-foreground">Corporate</div>
                <div className="text-xs text-muted-foreground">500+ Offices</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
