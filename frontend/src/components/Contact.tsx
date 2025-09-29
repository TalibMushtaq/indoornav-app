import { useState, useRef } from "react";
import Autoplay from "embla-carousel-autoplay"; // Plugin for looping
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
// --- NEW: Carousel component imports ---
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const Contact = () => {
  // --- STATE MANAGEMENT ---
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submissionStatus, setSubmissionStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  // --- Setup for the looping carousel plugin ---
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));

  // --- Image URLs for the carousel ---
  const carouselImages = [
    "https://ndoornav-app-bucket.s3.ap-south-1.amazonaws.com/indooranav-app-public-assets/contactus.jpg",
    "https://ndoornav-app-bucket.s3.ap-south-1.amazonaws.com/indooranav-app-public-assets/contactus2.jpg",
    "https://ndoornav-app-bucket.s3.ap-south-1.amazonaws.com/indooranav-app-public-assets/contactus3.jpg",
  ];

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionStatus({ loading: true, error: "", success: "" });
    const API_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/feedback/submit`;

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "An error occurred.");
      }
      setSubmissionStatus({
        loading: false,
        error: "",
        success: result.message,
      });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setSubmissionStatus({
        loading: false,
        error: error.message,
        success: "",
      });
    }
  };

  // --- JSX ---
  return (
    <section id="contact" className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Get in Touch
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            We're here to help and answer any question you might have.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
          {/* --- IMAGE CAROUSEL SECTION --- */}
          <div className="flex items-center justify-center">
            <Carousel
              plugins={[plugin.current]}
              className="w-full max-w-2xl"
              onMouseEnter={() => plugin.current.stop()}
              onMouseLeave={() => plugin.current.reset()}
            >
              <CarouselContent>
                {carouselImages.map((src, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                      <Card className="overflow-hidden">
                        <CardContent className="flex aspect-video items-center justify-center p-0">
                          <img
                            src={src}
                            alt={`Promotional image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* --- CONTACT FORM --- */}
          <Card>
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as
                possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Subject
                  </label>
                  <Input
                    id="subject"
                    placeholder="How can we help?"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more about your inquiry..."
                    className="min-h-[120px]"
                    required
                    value={formData.message}
                    onChange={handleChange}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submissionStatus.loading}
                >
                  {submissionStatus.loading ? "Sending..." : "Send Message"}
                  {!submissionStatus.loading && (
                    <Send className="ml-2 h-4 w-4" />
                  )}
                </Button>
                {submissionStatus.success && (
                  <p className="text-sm text-green-600 text-center">
                    {submissionStatus.success}
                  </p>
                )}
                {submissionStatus.error && (
                  <p className="text-sm text-red-600 text-center">
                    {submissionStatus.error}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Contact;
