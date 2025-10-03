import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Building, Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '@/components/ui/use-toast';
import { apiCallWithAuth, apiDelete } from '@/utils/api';

interface IBuilding {
  _id: string;
  name: string;
  description?: string;
  address?: string;
  image?: string;
  floors: {
    number: string;
    name: string;
  }[];
}

const AdminBuildings = () => {
  const [buildings, setBuildings] = useState<IBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState<IBuilding | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchBuildings = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await apiCallWithAuth('/admin/buildings', token);
      if (!response.ok) throw new Error('Failed to fetch buildings.');
      const data = await response.json();
      setBuildings(data.data.buildings);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const handleDeleteClick = (building: IBuilding) => {
    setBuildingToDelete(building);
    setDeleteDialogOpen(true);
  };
  const token = localStorage.getItem('adminToken');
  const handleDeleteConfirm = async () => {
    if (!buildingToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const response = await apiDelete(`/admin/buildings/${buildingToDelete._id}`,token!);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to delete building.');
      }

      toast({
        title: "Success!",
        description: `Building "${buildingToDelete.name}" has been deleted.`,
      });

      setBuildings(buildings.filter(b => b._id !== buildingToDelete._id));
      setDeleteDialogOpen(false);
      setBuildingToDelete(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <AdminLayout><p>Loading buildings...</p></AdminLayout>;
  if (error) return <AdminLayout><p className="text-destructive">Error: {error}</p></AdminLayout>;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Manage Buildings</h1>
        <Button asChild>
          <NavLink to="/admin/buildings/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Building
          </NavLink>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {buildings.length > 0 ? (
          buildings.map((building) => {
            const imageUrl = building.image;
            const placeholderUrl = `https://placehold.co/600x400/E2E8F0/4A5568?text=${encodeURIComponent(building.name)}`;

            return (
              <Card key={building._id} className="overflow-hidden">
                <img
                  src={imageUrl || placeholderUrl}
                  alt={building.name}
                  className="w-full h-40 object-cover bg-muted"
                  onError={(e) => { e.currentTarget.src = placeholderUrl; }}
                />
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      {building.name}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <NavLink to={`/admin/buildings/edit/${building._id}`}>
                          <Edit className="h-4 w-4" />
                        </NavLink>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteClick(building)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>{building.address || 'No address provided'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{building.description || 'No description.'}</p>
                  <div className="mt-4">
                    <h4 className="font-semibold text-sm">Floors: {building.floors.length}</h4>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p>No buildings found. Click "Add New Building" to get started.</p>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the building "{buildingToDelete?.name}" and all its associated landmarks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminBuildings;