import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, Shield, Accessibility } from "lucide-react";

const About = () => {
  const features = [
    {
      icon: MapPin,
      title: "Precise Navigation",
      description: "Get turn-by-turn directions to any location within buildings with pinpoint accuracy."
    },
    {
      icon: Accessibility,
      title: "Accessibility First",
      description: "Wheelchair accessible routes, visual aids support, and hearing assistance compatibility."
    },
    {
      icon: Users,
      title: "Visitor Friendly",
      description: "Easy-to-use interface designed for first-time visitors and regular users alike."
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Your navigation data is secure with enterprise-grade security and privacy protection."
    }
  ];

  return (
    <section id="about" className="py-16 bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            About NaviGuide
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're revolutionizing indoor navigation with cutting-edge technology that makes complex buildings easy to navigate for everyone.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* About Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-6">
              Simplifying Indoor Navigation
            </h3>
            <div className="space-y-4 text-muted-foreground">
              <p>
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
          </div>
          
          {/* Placeholder for about image */}
          <div className="bg-muted rounded-lg aspect-square flex items-center justify-center border">
            <div className="text-center">
              <Users className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Team & Mission Image</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;