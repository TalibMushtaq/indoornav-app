import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MapPin, ArrowLeft, Navigation2, Clock, Route, Accessibility, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const navigationSchema = z.object({
  building: z.string().min(1, { message: "Please select a building" }),
  from: z.string().min(1, { message: "Please select starting point" }),
  to: z.string().min(1, { message: "Please select destination" })
});

interface Landmark {
  id: string;
  name: string;
  type: string;
  floor: string;
  roomNumber?: string;
}

interface RouteStep {
  stepNumber: number;
  landmark: Landmark;
  instructions: string;
  distance: number;
  estimatedTime: number;
  difficulty: string;
}

const NavigationPage = () => {
  const [formData, setFormData] = useState({
    building: "",
    from: "",
    to: ""
  });
  const [preferences, setPreferences] = useState({
    wheelchairAccessible: false,
    avoidStairs: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [route, setRoute] = useState<{
    steps: RouteStep[];
    totalDistance: number;
    totalTime: number;
  } | null>(null);
  const { toast } = useToast();

  // Mock data - replace with API calls
  const buildings = [
    { id: "1", name: "Main Campus Building" },
    { id: "2", name: "Medical Center" },
    { id: "3", name: "Research Facility" }
  ];

  const landmarks: Landmark[] = [
    { id: "1", name: "Main Entrance", type: "entrance", floor: "1" },
    { id: "2", name: "Reception Desk", type: "facility", floor: "1", roomNumber: "101" },
    { id: "3", name: "Elevator Bank A", type: "elevator", floor: "1" },
    { id: "4", name: "Conference Room Alpha", type: "room", floor: "2", roomNumber: "201" },
    { id: "5", name: "Cafeteria", type: "facility", floor: "2", roomNumber: "205" },
    { id: "6", name: "Emergency Exit", type: "emergency_exit", floor: "1" }
  ];

  const filteredLandmarks = landmarks.filter(landmark => 
    formData.building ? true : false // Filter by building when implemented
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);
    setRoute(null);

    try {
      const validatedData = navigationSchema.parse(formData);
      
      if (validatedData.from === validatedData.to) {
        toast({
          title: "Same Location",
          description: "You are already at your destination!",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // TODO: Connect to your backend API
      // const response = await fetch('/api/navigation/route', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...validatedData,
      //     preferences
      //   })
      // });
      
      console.log("Navigation request:", { ...validatedData, preferences });
      
      // Mock route response
      const mockRoute = {
        steps: [
          {
            stepNumber: 1,
            landmark: landmarks.find(l => l.id === validatedData.from)!,
            instructions: "Start at your current location",
            distance: 0,
            estimatedTime: 0,
            difficulty: "easy"
          },
          {
            stepNumber: 2,
            landmark: landmarks.find(l => l.id === validatedData.to)!,
            instructions: "Head straight down the hallway for 50 meters, then turn left",
            distance: 75,
            estimatedTime: 2,
            difficulty: "easy"
          }
        ],
        totalDistance: 75,
        totalTime: 2
      };
      
      setRoute(mockRoute);
      
      toast({
        title: "Route Calculated",
        description: "Your navigation route is ready!"
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
          title: "Navigation Failed",
          description: "Unable to calculate route. Please try again.",
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
    
    // Reset dependent fields
    if (field === "building") {
      setFormData(prev => ({ ...prev, from: "", to: "" }));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "entrance": return "🚪";
      case "elevator": return "🛗";
      case "stairs": return "🪜";
      case "restroom": return "🚻";
      case "emergency_exit": return "🚨";
      case "facility": return "🏢";
      case "room": return "📍";
      default: return "📍";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Navigation Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Navigation2 className="h-6 w-6 text-primary" />
                <CardTitle>Find Your Way</CardTitle>
              </div>
              <CardDescription>
                Select your starting point and destination
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="building">Building</Label>
                  <Select
                    value={formData.building}
                    onValueChange={(value) => handleInputChange("building", value)}
                  >
                    <SelectTrigger className={errors.building ? "border-destructive" : ""}>
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
                  {errors.building && (
                    <p className="text-sm text-destructive">{errors.building}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from">From (Starting Point)</Label>
                  <Select
                    value={formData.from}
                    onValueChange={(value) => handleInputChange("from", value)}
                    disabled={!formData.building}
                  >
                    <SelectTrigger className={errors.from ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select starting location" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLandmarks.map((landmark) => (
                        <SelectItem key={landmark.id} value={landmark.id}>
                          <div className="flex items-center space-x-2">
                            <span>{getTypeIcon(landmark.type)}</span>
                            <span>{landmark.name}</span>
                            {landmark.roomNumber && (
                              <Badge variant="outline">{landmark.roomNumber}</Badge>
                            )}
                            <Badge variant="secondary">Floor {landmark.floor}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.from && (
                    <p className="text-sm text-destructive">{errors.from}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="to">To (Destination)</Label>
                  <Select
                    value={formData.to}
                    onValueChange={(value) => handleInputChange("to", value)}
                    disabled={!formData.building}
                  >
                    <SelectTrigger className={errors.to ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLandmarks.map((landmark) => (
                        <SelectItem key={landmark.id} value={landmark.id}>
                          <div className="flex items-center space-x-2">
                            <span>{getTypeIcon(landmark.type)}</span>
                            <span>{landmark.name}</span>
                            {landmark.roomNumber && (
                              <Badge variant="outline">{landmark.roomNumber}</Badge>
                            )}
                            <Badge variant="secondary">Floor {landmark.floor}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.to && (
                    <p className="text-sm text-destructive">{errors.to}</p>
                  )}
                </div>

                <Separator />

                {/* Accessibility Preferences */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Accessibility Preferences</Label>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Accessibility className="h-4 w-4" />
                      <Label htmlFor="wheelchair" className="text-sm">
                        Wheelchair Accessible Route
                      </Label>
                    </div>
                    <Switch
                      id="wheelchair"
                      checked={preferences.wheelchairAccessible}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({ ...prev, wheelchairAccessible: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4" />
                      <Label htmlFor="stairs" className="text-sm">
                        Avoid Stairs
                      </Label>
                    </div>
                    <Switch
                      id="stairs"
                      checked={preferences.avoidStairs}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({ ...prev, avoidStairs: checked }))
                      }
                    />
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>Note:</strong> This form requires backend connection to function. 
                    Connect to your API endpoints to enable route calculation.
                  </AlertDescription>
                </Alert>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Calculating Route..." : "Get Directions"}
                  <Route className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Route Display */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <MapPin className="h-6 w-6 text-primary" />
                <CardTitle>Your Route</CardTitle>
              </div>
              <CardDescription>
                Turn-by-turn navigation instructions
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {route ? (
                <div className="space-y-4">
                  {/* Route Summary */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{route.totalDistance}m</div>
                      <div className="text-sm text-muted-foreground">Total Distance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{route.totalTime}min</div>
                      <div className="text-sm text-muted-foreground">Estimated Time</div>
                    </div>
                  </div>

                  {/* Route Steps */}
                  <div className="space-y-3">
                    {route.steps.map((step, index) => (
                      <div key={step.stepNumber} className="flex space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                            {step.stepNumber}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">{step.landmark.name}</span>
                            <Badge className={getDifficultyColor(step.difficulty)}>
                              {step.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {step.instructions}
                          </p>
                          {step.distance > 0 && (
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Route className="h-3 w-3" />
                                <span>{step.distance}m</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{step.estimatedTime}min</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full" variant="outline">
                    Start Navigation
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select your starting point and destination to see directions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NavigationPage;