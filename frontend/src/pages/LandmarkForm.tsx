import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from "@/components/ui/use-toast";
import { apiCallWithAuth } from '@/utils/api';

interface IBuilding {
  _id: string;
  name: string;
  floors: { number: string; name: string }[];
}

const landmarkTypes = [
  'room', 'entrance', 'elevator', 'stairs', 'restroom', 'emergency_exit', 'facility', 'other',
  'lecture_hall', 'classroom', 'lab', 'library', 'auditorium', 'department_office',
  'admissions_office', 'student_union', 'cafeteria', 'bookstore', 'gym', 
  'health_center', 'information_desk'
];

const LandmarkForm = () => {
  const { landmarkId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(landmarkId);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [floor, setFloor] = useState('');
  const [type, setType] = useState('');
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [buildings, setBuildings] = useState<IBuilding[]>([]);
  const [availableFloors, setAvailableFloors] = useState<{ number: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuildings = async () => {
      const token = localStorage.getItem('adminToken');
      try {
        const response = await apiCallWithAuth('/admin/buildings', token!);
        if (!response.ok) throw new Error('Could not fetch buildings.');
        const data = await response.json();
        setBuildings(data.data.buildings);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchBuildings();
  }, []);

  useEffect(() => {
    if (isEditing && landmarkId && buildings.length > 0) {
      const fetchLandmarkData = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('adminToken');
        try {
          const response = await apiCallWithAuth(`/admin/landmarks/${landmarkId}`, token!);
          if (!response.ok) throw new Error('Failed to fetch landmark data.');
          const data = await response.json();
          const landmark = data.data.landmark;
          
          setName(landmark.name);
          setDescription(landmark.description || '');
          setBuildingId(landmark.building._id);
          setType(landmark.type);
          setCoordinates({
            x: Number(landmark.coordinates?.x) || 0,
            y: Number(landmark.coordinates?.y) || 0
          });

          const parentBuilding = buildings.find(b => b._id === landmark.building._id);
          if (parentBuilding) setAvailableFloors(parentBuilding.floors);
          setFloor(landmark.floor);

          if (landmark.images) {
            setImagePreviews(landmark.images);
          }

        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchLandmarkData();
    }
  }, [landmarkId, isEditing, buildings]);

  useEffect(() => {
    const selectedBuilding = buildings.find(b => b._id === buildingId);
    setAvailableFloors(selectedBuilding ? selectedBuilding.floors : []);
    if (document.activeElement?.id === 'building-select-trigger') setFloor('');
  }, [buildingId, buildings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5);
      setImages(files);
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    const token = localStorage.getItem('adminToken');

    if (!buildingId || buildingId.length !== 24) {
      setError("Please select a valid building.");
      setIsLoading(false);
      return;
    }
    if (!type) {
      setError("Please select a landmark type.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    if (description) formData.append('description', description.trim());
    formData.append('building', buildingId);
    formData.append('floor', floor);
    formData.append('type', type);
    formData.append('coordinates', JSON.stringify({ x: Number(coordinates.x), y: Number(coordinates.y) }));

    images.forEach(file => formData.append('images', file));

    const endpoint = isEditing
      ? `/admin/landmarks/${landmarkId}`
      : `/admin/landmarks`;
      
    const method = isEditing ? 'PUT' : 'POST';

    // Progress simulation (similar to BuildingForm)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const response = await apiCallWithAuth(endpoint, token!, {
        method,
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to save landmark.');
      }
      
      toast({
        title: "Success!",
        description: `Landmark "${name}" has been ${isEditing ? 'updated' : 'created'}.`
      });

      setTimeout(() => {
        navigate('/admin/landmarks');
      }, 500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message);
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Landmark' : 'Add New Landmark'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Landmark Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Landmark Type</Label>
                <Select value={type} onValueChange={setType} required>
                  <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                  <SelectContent>
                    {landmarkTypes.map(t => (
                      <SelectItem key={t} value={t}>
                        {t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="building">Building</Label>
                <Select value={buildingId} onValueChange={setBuildingId} required>
                  <SelectTrigger id="building-select-trigger"><SelectValue placeholder="Select a building" /></SelectTrigger>
                  <SelectContent>
                    {buildings.map(b => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Select value={floor} onValueChange={setFloor} required disabled={!buildingId}>
                  <SelectTrigger><SelectValue placeholder="Select a floor" /></SelectTrigger>
                  <SelectContent>
                    {availableFloors.map(f => <SelectItem key={f.number} value={f.number}>{f.name} ({f.number})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Coordinates</Label>
                <div className="flex gap-4">
                  <Input type="number" placeholder="X" value={coordinates.x} onChange={e => setCoordinates({...coordinates, x: Number(e.target.value)})} />
                  <Input type="number" placeholder="Y" value={coordinates.y} onChange={e => setCoordinates({...coordinates, y: Number(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="images">Landmark Images (up to 5)</Label>
                <Input 
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer file:bg-black file:text-white file:py-1 file:px-3 file:rounded file:border-0 file:hover:opacity-90"
                />
                {imagePreviews.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative w-24 h-24 border rounded overflow-hidden">
                        <img src={src} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 bg-green-500 p-1 rounded-full">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isLoading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {error && <p className="text-destructive text-sm mt-2">{error}</p>}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Landmark' : 'Create Landmark')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/admin/landmarks')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default LandmarkForm;