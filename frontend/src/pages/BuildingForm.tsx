import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/components/ui/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Floor {
  number: string;
  name: string;
}

const BuildingForm = () => {
  const { buildingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(buildingId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [buildingImage, setBuildingImage] = useState<string | File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [floors, setFloors] = useState<Floor[]>([{ number: '', name: '' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && buildingId) {
      const fetchBuildingData = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('adminToken');
        try {
          const response = await fetch(`${API_BASE_URL}/api/admin/buildings/${buildingId}`, {
             headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('Failed to fetch building data.');
          const data = await response.json();
          const building = data.data.building;
          
          setName(building.name);
          setDescription(building.description || '');
          setAddress(building.address || '');
          if (building.image) {
            setBuildingImage(building.image);
            setImagePreview(building.image);
          }
          setFloors(building.floors || [{ number: '', name: '' }]);

        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchBuildingData();
    }
  }, [buildingId, isEditing]);

  const handleFloorChange = (index: number, field: 'number' | 'name', value: string) => {
    const newFloors = [...floors];
    newFloors[index][field] = value;
    setFloors(newFloors);
  };

  const handleImageChange = (file: File | null) => {
    if (file) {
      setBuildingImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addFloor = () => {
    setFloors([...floors, { number: '', name: '' }]);
  };

  const removeFloor = (index: number) => {
    if (floors.length > 1) {
      setFloors(floors.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    const token = localStorage.getItem('adminToken');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('address', address);
    formData.append('floors', JSON.stringify(floors));

    if (buildingImage instanceof File) {
      formData.append('image', buildingImage);
    }
    
    const url = isEditing
      ? `${API_BASE_URL}/api/admin/buildings/${buildingId}`
      : `${API_BASE_URL}/api/admin/buildings`;
      
    const method = isEditing ? 'PUT' : 'POST';

    // Simulate upload progress
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
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to save building.');
      }
      
      toast({
        title: "Success!",
        description: `Building "${name}" has been ${isEditing ? 'updated' : 'created'}.`
      });

      setTimeout(() => {
        navigate('/admin/buildings');
      }, 500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message);
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsUploading(false), 500);
    }
  };

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Building' : 'Add New Building'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Building Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="building-image">Building Image</Label>
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Input 
                    id="building-image" 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageChange(e.target.files ? e.target.files[0] : null)}
                    className="cursor-pointer"
                  />
                  {imagePreview && (
                    <div className="mt-4 relative">
                      <img 
                        src={imagePreview} 
                        alt="Building preview" 
                        className="w-full max-w-md h-48 object-cover rounded-lg border"
                      />
                      {buildingImage instanceof File && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {typeof buildingImage === 'string' && buildingImage && (
                  <a href={buildingImage} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                    View current image
                  </a>
                )}
              </div>
            </div>

            <div>
              <Label>Floors</Label>
              <div className="space-y-4 mt-2">
                {floors.map((floor, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 items-end gap-4 p-4 border rounded-md relative">
                    <div className="space-y-2">
                      <Label htmlFor={`floor-number-${index}`} className="text-xs">Floor Number</Label>
                      <Input id={`floor-number-${index}`} value={floor.number} onChange={(e) => handleFloorChange(index, 'number', e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor={`floor-name-${index}`} className="text-xs">Floor Name</Label>
                      <Input id={`floor-name-${index}`} value={floor.name} onChange={(e) => handleFloorChange(index, 'name', e.target.value)} required />
                    </div>
                     <Button type="button" variant="destructive" size="icon" onClick={() => removeFloor(index)} disabled={floors.length <= 1} className="absolute -top-3 -right-3">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
               <Button type="button" variant="outline" size="sm" onClick={addFloor} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Floor
              </Button>
            </div>
            
            {error && <p className="text-destructive text-sm mt-4">{error}</p>}

            {/* Upload Progress Indicator */}
            {isUploading && (
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

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isUploading ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Save Building
                  </>
                )}
              </Button>
               <Button type="button" variant="ghost" onClick={() => navigate('/admin/buildings')} disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default BuildingForm;