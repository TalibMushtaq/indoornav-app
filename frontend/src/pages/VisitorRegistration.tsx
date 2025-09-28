import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, ArrowLeft, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const visitorSchema = z.object({
  name: z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100),
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  phone: z.string().trim().min(10, { message: "Phone number must be at least 10 digits" }).max(15),
  buildingId: z.string().min(1, { message: "Please select a building" })
});

const VisitorRegistration = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    buildingId: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Mock buildings data - replace with API call
  const buildings = [
    { id: "1", name: "Main Campus Building" },
    { id: "2", name: "Medical Center" },
    { id: "3", name: "Research Facility" },
    { id: "4", name: "Student Union" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const validatedData = visitorSchema.parse(formData);
      
      // TODO: Connect to your backend API
      // const response = await fetch('/api/visitors/log', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(validatedData)
      // });
      
      console.log("Visitor registration:", validatedData);
      
      toast({
        title: "Registration Successful",
        description: "Welcome! You can now navigate the building."
      });
      
      // Clear form
      setFormData({
        name: "",
        email: "",
        phone: "",
        buildingId: ""
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path && issue.path.length > 0) {
            newErrors[String(issue.path[0])] = issue.message;
          }
        });
        setErrors(newErrors);
      } else {
        toast({
          title: "Registration Failed",
          description: "An error occurred. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Visitor Registration</CardTitle>
            <CardDescription>
              Register to access building navigation
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildingId">Building to Visit</Label>
                <Select
                  value={formData.buildingId}
                  onValueChange={(value) => handleInputChange("buildingId", value)}
                >
                  <SelectTrigger className={errors.buildingId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select a building" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((building) => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.buildingId && (
                  <p className="text-sm text-destructive">{errors.buildingId}</p>
                )}
              </div>

              <Alert>
                <AlertDescription>
                  Your information is collected to enhance your navigation experience 
                  and for security purposes. We respect your privacy.
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertDescription>
                  <strong>Note:</strong> This form requires backend connection to function. 
                  Connect to your API endpoints to enable visitor registration.
                </AlertDescription>
              </Alert>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Registering..." : "Register & Continue"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already registered today?{" "}
                <Button variant="link" className="p-0 h-auto font-normal">
                  Continue to navigation
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisitorRegistration;