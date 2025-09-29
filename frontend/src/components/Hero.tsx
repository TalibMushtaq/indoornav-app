import { Button } from "@/components/ui/button";
import { ArrowRight, Navigation } from "lucide-react";

const Hero = () => {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Hero Icon */}
          <div className="mb-8 flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Navigation className="h-16 w-16 text-primary" />
            </div>
          </div>
          
          {/* Hero Text */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Navigate Any Building
            <span className="block text-primary">With Confidence</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Our intelligent indoor navigation system helps you find your way through complex buildings with turn-by-turn directions, accessibility options, and real-time guidance.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => window.location.href = "/navigation"}>
              Start Navigation
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => window.location.href = "/visitor/register"}>
              Register as Visitor
            </Button>
          </div>
          
          {/* Responsive Hero Image */}
          <div className="mt-12 relative">
            {/* This new div is the frame with the border and padding */}
            <div className="max-w-4xl mx-auto border bg-background rounded-lg p-2">
              <picture>
                {/* Image for screens 640px and wider (desktop) */}
                <source
                  media="(min-width: 640px)"
                  srcSet="https://ndoornav-app-bucket.s3.ap-south-1.amazonaws.com/indooranav-app-public-assets/heroplaceholder.jpg"
                />
                {/* Default image for smaller screens (mobile) */}
                <img
                  src="https://ndoornav-app-bucket.s3.ap-south-1.amazonaws.com/indooranav-app-public-assets/heromob.jpg"
                  alt="Interactive Building Map Preview"
                  className="rounded-md w-full"
                />
              </picture>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;