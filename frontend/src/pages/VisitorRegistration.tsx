import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { apiCall, apiPost } from "@/utils/api";

const visitorSchema = z.object({
  name: z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  address: z.string().trim().min(5, { message: "Address is too short" }).max(250).optional().or(z.literal('')),
  buildingId: z.string().min(1, { message: "Please select a building" })
});

interface Building {
  id: string;
  name: string;
}

const VisitorRegistration = () => {
  const [formData, setFormData] = useState({ name: "", phone: "", address: "", buildingId: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [hasToken, setHasToken] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('visitorToken');
    if (token) setHasToken(true);

    const fetchBuildings = async () => {
      try {
        // CORRECTED: Path does not include /api
        const response = await apiCall('/buildings/list');
        if (!response.ok) {
          throw new Error(`Failed to fetch buildings: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Buildings API result:", result);

        if (result.success && Array.isArray(result.data)) {
          const mappedBuildings = result.data.map((b: any) => ({
            id: b.id, // The backend for this route already provides 'id'
            name: b.name
          }));
          setBuildings(mappedBuildings);
        } else {
          throw new Error("Invalid data format from server.");
        }
      } catch (error) {
        console.error("Fetch buildings error:", error);
        toast({
          title: "Error",
          description: "Could not load building list.",
          variant: "destructive"
        });
      }
    };

    fetchBuildings();
  }, [toast]);

  useEffect(() => {
    if (hasToken) navigate("/navigation");
  }, [hasToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const validatedData = visitorSchema.parse(formData);

      // CORRECTED: Path does not include /api
      const response = await apiPost('/visitors/log', validatedData);

      const result = await response.json();

      if (!response.ok || !result.success) throw new Error(result.message || 'An unknown error occurred.');

      if (result.data?.token) {
        localStorage.setItem('visitorToken', result.data.token);
        setHasToken(true);
      }

      toast({
        title: "Registration Successful",
        description: "Welcome! You can now navigate the building."
      });

      setFormData({ name: "", phone: "", address: "", buildingId: "" });

    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach(issue => {
          if (issue.path[0]) newErrors[String(issue.path[0])] = issue.message;
        });
        setErrors(newErrors);
      } else {
        toast({
          title: "Registration Failed",
          description: (error as Error).message || "An error occurred. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleOptOut = () => {
    localStorage.removeItem('visitorToken');
    setHasToken(false);
  };

  if (hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>You're already registered!</CardTitle>
            <CardDescription>You are currently registered to a building.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleOptOut} className="w-full mt-4">
              Change Building / Re-register
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" className="mb-6" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Visitor Registration</CardTitle>
            <CardDescription>Register to access building navigation</CardDescription>
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
                {errors.name && (<p className="text-sm text-destructive">{errors.name}</p>)}
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
                {errors.phone && (<p className="text-sm text-destructive">{errors.phone}</p>)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="123 Main St, Anytown, USA"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className={errors.address ? "border-destructive" : ""}
                />
                {errors.address && (<p className="text-sm text-destructive">{errors.address}</p>)}
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
                    {buildings.length > 0 ? (
                      buildings.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        Loading buildings...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {errors.buildingId && (<p className="text-sm text-destructive">{errors.buildingId}</p>)}
              </div>

              <Alert>
                <AlertDescription>
                  Your information is collected to enhance your navigation experience and for security purposes.
                </AlertDescription>
              </Alert>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Registering..." : "Register & Continue"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Proceed to find your way within the building.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisitorRegistration;