import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, MapPin, Edit, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Updated interface to include optional images array
interface ILandmark {
  _id: string;
  name: string;
  type: string;
  floor: string;
  building?: {
    _id: string;
    name: string;
  };
  images?: { url: string }[]; // This will hold the image URLs
}

const AdminLandmarks = () => {
  const [landmarks, setLandmarks] = useState<ILandmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLandmarks = async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/landmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch landmarks.');
      const data = await response.json();
      setLandmarks(data.data.landmarks);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandmarks();
  }, []);

  const handleDelete = async (landmarkId: string) => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/landmarks/${landmarkId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to delete landmark.');
      }
      toast({
        title: "Success!",
        description: "Landmark has been deleted.",
      });
      fetchLandmarks();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (loading) return <AdminLayout><p>Loading landmarks...</p></AdminLayout>;
  if (error) return <AdminLayout><p className="text-destructive">Error: {error}</p></AdminLayout>;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Manage Landmarks</h1>
        <Button asChild>
          <NavLink to="/admin/landmarks/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Landmark
          </NavLink>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {landmarks.length > 0 ? (
          landmarks.map((landmark) => {
            // Logic to find the first image or use a placeholder
            const imageUrl = landmark.images?.[0]?.url;
            const placeholderUrl = `https://placehold.co/600x400/E2E8F0/4A5568?text=${encodeURIComponent(landmark.name)}`;

            return (
              <Card key={landmark._id} className="overflow-hidden">
                {/* Image Tag */}
                <img
                  src={imageUrl || placeholderUrl}
                  alt={landmark.name}
                  className="w-full h-40 object-cover bg-muted"
                  onError={(e) => { e.currentTarget.src = placeholderUrl; }}
                />
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {landmark.name}
                    </div>
                     <div className="flex items-center">
                      <Button variant="ghost" size="icon" asChild>
                        <NavLink to={`/admin/landmarks/edit/${landmark._id}`}>
                          <Edit className="h-4 w-4" />
                        </NavLink>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action will delete the landmark "{landmark.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(landmark._id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                     </div>
                  </CardTitle>
                  <CardDescription>
                    {landmark.building?.name || 'Unknown Building'} - Floor {landmark.floor}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Type: <span className="font-medium capitalize">{landmark.type.replace(/_/g, ' ')}</span></p>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center p-8 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No Landmarks Found</h3>
            <p className="text-muted-foreground mt-2">Get started by adding your first landmark.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminLandmarks;