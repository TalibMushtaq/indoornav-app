import { useState, useEffect } from "react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  ArrowLeft,
  Navigation2,
  Clock,
  Route,
  AlertTriangle
} from "lucide-react";

// ----- Validation Schema -----
const navigationSchema = z.object({
  building: z.string().min(1, { message: "Please select a building" }),
  from: z.string().min(1, { message: "Please select starting point" }),
  to: z.string().min(1, { message: "Please select destination" })
});

// ----- Types -----
interface LandmarkImage {
  url: string;
  caption?: string;
}

interface Landmark {
  _id: string;
  name: string;
  type: string;
  floor: string;
  roomNumber?: string;
  images?: LandmarkImage[];
}

interface RouteStep {
  stepNumber: number;
  landmark: Landmark;
  instructions: string;
  distance: number;
  estimatedTime: number;
  difficulty: string;
}

// ----- Component -----
const NavigationPage = () => {
  const [formData, setFormData] = useState({ building: "", from: "", to: "" });
  const [preferences, setPreferences] = useState({ wheelchairAccessible: false, avoidStairs: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [buildings, setBuildings] = useState<{ id: string; name: string }[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [route, setRoute] = useState<{ steps: RouteStep[]; totalDistance: number; totalTime: number } | null>(null);
  const [visitorToken, setVisitorToken] = useState<string | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  // ----- Check if visitor already registered -----
  useEffect(() => {
    const token = localStorage.getItem("visitorToken");
    if (token) setVisitorToken(token);
  }, []);

  // ----- Handle Opt-Out -----
  const handleOptOut = () => {
    localStorage.removeItem("visitorToken");
    setVisitorToken(null);
    navigate("/visitor-registration");
  };

  // ----- Fetch buildings -----
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await fetch(`/api/navigation/buildings?page=1&limit=100`);
        const data = await res.json();
        if (data.success) {
          setBuildings(data.data.buildings.map((b: any) => ({ id: b._id, name: b.name })));
        } else {
          toast({ title: "Error", description: "Failed to fetch buildings", variant: "destructive" });
        }
      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: "Failed to fetch buildings", variant: "destructive" });
      }
    };
    fetchBuildings();
  }, []);

  // ----- Fetch landmarks for selected building -----
  useEffect(() => {
    const fetchLandmarks = async () => {
      if (!formData.building) return;
      try {
        const res = await fetch(`/api/navigation/buildings/${formData.building}/landmarks`);
        const data = await res.json();
        if (data.success) {
          setLandmarks(data.data.landmarks);
        } else {
          toast({ title: "Error", description: "Failed to fetch landmarks", variant: "destructive" });
        }
      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: "Failed to fetch landmarks", variant: "destructive" });
      }
    };
    fetchLandmarks();
  }, [formData.building]);

  const filteredLandmarks = landmarks;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
    if (field === "building") setFormData(prev => ({ ...prev, from: "", to: "" }));
  };

  // ----- Handle Submit -----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);
    setRoute(null);

    try {
      const validatedData = navigationSchema.parse(formData);

      if (validatedData.from === validatedData.to) {
        toast({ title: "Same Location", description: "You are already at your destination!", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/navigation/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validatedData, preferences })
      });
      const data = await res.json();

      if (data.success) {
        setRoute(data.data.route);
        toast({ title: "Route Calculated", description: "Your navigation route is ready!" });
      } else {
        toast({ title: "Error", description: data.message || "Failed to calculate route", variant: "destructive" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path && issue.path.length > 0) newErrors[String(issue.path[0])] = issue.message;
        });
        setErrors(newErrors);
      } else {
        toast({ title: "Error", description: "Failed to calculate route", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ----- Helpers -----
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

  const getLandmarkImageUrl = (images?: LandmarkImage[]) => {
    if (!images || images.length === 0) return '';
    return images[0].url;
  };

  // ----- JSX -----
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="container mx-auto max-w-4xl">

        {/* NaviGuide Header */}
        <div className="mb-4">
          <h1
            className="text-2xl font-bold cursor-pointer text-primary hover:underline"
            onClick={() => navigate("/")}
          >
            NaviGuide
          </h1>
        </div>

        {/* Opt-Out Button */}
        {visitorToken && (
          <div className="mb-4 text-right">
            <Button variant="destructive" size="sm" onClick={handleOptOut}>
              Re-register for a different building
            </Button>
          </div>
        )}

        {/* Back Button */}
        <Button variant="ghost" className="mb-6" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Navigation Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Navigation2 className="h-6 w-6 text-primary" />
                <CardTitle>Find Your Way</CardTitle>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Building Select */}
                <div className="space-y-2">
                  <Label htmlFor="building">Building</Label>
                  <Select value={formData.building} onValueChange={v => handleInputChange("building", v)}>
                    <SelectTrigger className={errors.building ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select a building" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.building && <p className="text-sm text-destructive">{errors.building}</p>}
                </div>

                {/* From Select */}
                <div className="space-y-2">
                  <Label htmlFor="from">From (Starting Point)</Label>
                  <Select value={formData.from} onValueChange={v => handleInputChange("from", v)} disabled={!formData.building}>
                    <SelectTrigger className={errors.from ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select starting location" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLandmarks.map(lm => (
                        <SelectItem key={lm._id} value={lm._id}>
                          <div className="flex items-center space-x-2">
                            <span>{getTypeIcon(lm.type)}</span>
                            <span>{lm.name}</span>
                            {lm.roomNumber && <Badge variant="outline">{lm.roomNumber}</Badge>}
                            <Badge variant="secondary">Floor {lm.floor}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.from && <p className="text-sm text-destructive">{errors.from}</p>}
                </div>

                {/* To Select */}
                <div className="space-y-2">
                  <Label htmlFor="to">To (Destination)</Label>
                  <Select value={formData.to} onValueChange={v => handleInputChange("to", v)} disabled={!formData.building}>
                    <SelectTrigger className={errors.to ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLandmarks.map(lm => (
                        <SelectItem key={lm._id} value={lm._id}>
                          <div className="flex items-center space-x-2">
                            <span>{getTypeIcon(lm.type)}</span>
                            <span>{lm.name}</span>
                            {lm.roomNumber && <Badge variant="outline">{lm.roomNumber}</Badge>}
                            <Badge variant="secondary">Floor {lm.floor}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.to && <p className="text-sm text-destructive">{errors.to}</p>}
                </div>

                {/* Preferences */}
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="wheelchairAccessible"
                      checked={preferences.wheelchairAccessible}
                      onCheckedChange={checked => setPreferences(prev => ({ ...prev, wheelchairAccessible: checked }))}
                    />
                    <Label htmlFor="wheelchairAccessible" className="mb-0">Wheelchair Accessible</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="avoidStairs"
                      checked={preferences.avoidStairs}
                      onCheckedChange={checked => setPreferences(prev => ({ ...prev, avoidStairs: checked }))}
                    />
                    <Label htmlFor="avoidStairs" className="mb-0">Avoid Stairs</Label>
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Calculating..." : "Calculate Route"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Route Display */}
          <Card>
            <CardHeader>
              <CardTitle>Navigation Route</CardTitle>
              <CardDescription>See the steps and start navigation</CardDescription>
            </CardHeader>
            <CardContent>
              {route ? (
                <div className="space-y-4">
                  {/* Start and End Images */}
                  <div className="flex justify-between space-x-4 mb-4">
                    {/* Start */}
                    <div className="flex-1 text-center">
                      <div className="font-medium mb-1">{route.steps[0].landmark.name}</div>
                      {route.steps[0].landmark.images && route.steps[0].landmark.images.length > 0 ? (
                        <img
                          src={getLandmarkImageUrl(route.steps[0].landmark.images)}
                          alt={route.steps[0].landmark.name}
                          className="w-full h-40 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.src = `https://placehold.co/400x300/E2E8F0/4A5568?text=${encodeURIComponent(route.steps[0].landmark.name)}`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded-lg border text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* End */}
                    <div className="flex-1 text-center">
                      <div className="font-medium mb-1">{route.steps[route.steps.length - 1].landmark.name}</div>
                      {route.steps[route.steps.length - 1].landmark.images && route.steps[route.steps.length - 1].landmark.images.length > 0 ? (
                        <img
                          src={getLandmarkImageUrl(route.steps[route.steps.length - 1].landmark.images)}
                          alt={route.steps[route.steps.length - 1].landmark.name}
                          className="w-full h-40 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.src = `https://placehold.co/400x300/E2E8F0/4A5568?text=${encodeURIComponent(route.steps[route.steps.length - 1].landmark.name)}`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded-lg border text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Route Summary */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>{Math.round(route.totalTime)} mins</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Route className="h-5 w-5 text-primary" />
                      <span>{Math.round(route.totalDistance)} m</span>
                    </div>
                  </div>

                  {/* Route Steps */}
                  <div className="space-y-3">
                    {route.steps.map(step => (
                      <Alert key={step.stepNumber} variant="default" className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{getTypeIcon(step.landmark.type)}</span>
                          <div>
                            <div className="font-medium">{step.landmark.name}</div>
                            <div className="text-sm">{step.instructions}</div>
                          </div>
                        </div>
                        <Badge className={getDifficultyColor(step.difficulty)}>{step.difficulty}</Badge>
                      </Alert>
                    ))}
                  </div>

                  <Button className="w-full mt-4">Start Navigation</Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-destructive" />
                  <p className="text-sm text-muted-foreground">No route calculated yet</p>
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
