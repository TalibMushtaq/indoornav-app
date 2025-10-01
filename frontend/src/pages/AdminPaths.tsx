import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch'; // <-- ADDED: Import Switch for status toggle
import { toast } from 'sonner';
import axios from 'axios';

// --- API Utility ---
const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Type Definitions ---
interface Building {
  _id: string;
  name: string;
}

interface Landmark {
  _id: string;
  name: string;
  floor: string;
}

interface Path {
  _id: string;
  from: Landmark;
  to: Landmark;
  distance: number;
  estimatedTime: number;
  isBidirectional: boolean;
  instructions: string;
  status: 'open' | 'closed' | 'restricted'; // <-- ADDED: Status field
}

type PathFormData = {
  _id: string | null;
  from: string;
  to: string;
  distance: number;
  estimatedTime: number;
  instructions: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isBidirectional: boolean;
  status: 'open' | 'closed' | 'restricted'; // <-- ADDED: Status field
  accessibility: {
    wheelchairAccessible: boolean;
    requiresStairs: boolean;
  };
};

// --- Constants ---
const INITIAL_PATH_STATE: PathFormData = {
  _id: null,
  from: '',
  to: '',
  distance: 10,
  estimatedTime: 30,
  instructions: 'Walk straight towards the destination.',
  difficulty: 'easy',
  isBidirectional: true,
  status: 'open', // <-- ADDED: Initial status
  accessibility: {
    wheelchairAccessible: true,
    requiresStairs: false,
  },
};

// --- The Component ---
const AdminPaths = () => {
  // --- State Management ---
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [loading, setLoading] = useState({ buildings: true, paths: false });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState<PathFormData>(INITIAL_PATH_STATE);

  // --- Reusable Error Handler ---
  const handleApiError = useCallback((error: unknown, context: string) => {
    let errorMessage = `Failed to ${context}.`;
    if (axios.isAxiosError(error) && error.response) {
      console.error(`API Error (${context}):`, error.response.data);
      errorMessage = error.response.data.message || errorMessage;
    } else {
      console.error(`Network/Request Error (${context}):`, error);
    }
    toast.error(errorMessage);
  }, []);

  // --- Data Fetching Logic ---
  const fetchBuildings = useCallback(async () => {
    setLoading(prev => ({ ...prev, buildings: true }));
    try {
      const { data } = await api.get('/admin/buildings?limit=100');
      if (data.success) {
        setBuildings(data.data.buildings);
        if (data.data.buildings.length > 0) {
          setSelectedBuilding(data.data.buildings[0]._id);
        }
      } else {
        toast.error(data.message || 'Failed to fetch buildings.');
      }
    } catch (error) {
      handleApiError(error, 'fetch buildings');
    } finally {
      setLoading(prev => ({ ...prev, buildings: false }));
    }
  }, [handleApiError]);

  const fetchLandmarks = useCallback(async (buildingId: string) => {
    try {
      const { data } = await api.get(`/navigation/buildings/${buildingId}/landmarks`);
      setLandmarks(data.success ? data.data.landmarks || [] : []);
    } catch (error) {
      handleApiError(error, 'fetch landmarks');
      setLandmarks([]);
    }
  }, [handleApiError]);

  const fetchPaths = useCallback(async (buildingId: string) => {
    setLoading(prev => ({ ...prev, paths: true }));
    try {
      const { data } = await api.get(`/admin/paths?building=${buildingId}&limit=100`);
      setPaths(data.success ? data.data.paths || [] : []);
    } catch (error) {
      handleApiError(error, 'fetch paths');
      setPaths([]);
    } finally {
      setLoading(prev => ({ ...prev, paths: false }));
    }
  }, [handleApiError]);

  // --- Effects ---
  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  useEffect(() => {
    if (selectedBuilding) {
      fetchLandmarks(selectedBuilding);
      fetchPaths(selectedBuilding);
    } else {
      setLandmarks([]);
      setPaths([]);
    }
  }, [selectedBuilding, fetchLandmarks, fetchPaths]);

  // --- Event Handlers ---
  const openModalForCreate = () => {
    setCurrentPath(INITIAL_PATH_STATE);
    setIsModalOpen(true);
  };

  const openModalForEdit = (path: Path) => {
    setCurrentPath({
      _id: path._id,
      from: path.from._id,
      to: path.to._id,
      distance: path.distance,
      estimatedTime: path.estimatedTime,
      instructions: path.instructions,
      isBidirectional: path.isBidirectional,
      status: path.status || 'open', // <-- ADDED: Populate status for editing
      difficulty: 'easy',
      accessibility: { wheelchairAccessible: true, requiresStairs: false },
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { _id, ...pathData } = currentPath;

    const submissionData = {
      ...pathData,
      distance: String(pathData.distance),
      estimatedTime: String(pathData.estimatedTime),
      isBidirectional: String(pathData.isBidirectional), // <-- FIXED: Ensure boolean is sent as a string
      accessibility: JSON.stringify(pathData.accessibility),
    };

    const apiCall = _id
      ? api.put(`/admin/paths/${_id}`, submissionData)
      : api.post('/admin/paths', submissionData);

    try {
      await apiCall;
      toast.success(`Path ${_id ? 'updated' : 'created'} successfully!`);
      setIsModalOpen(false);
      fetchPaths(selectedBuilding);
    } catch (error) {
      handleApiError(error, _id ? 'update path' : 'create path');
    }
  };

  const handleDelete = async (pathId: string) => {
    if (!window.confirm('Are you sure you want to delete this path? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/paths/${pathId}`);
      toast.success('Path deleted successfully!');
      fetchPaths(selectedBuilding);
    } catch (error: any) {
      handleApiError(error, 'delete path');
    }
  };

  // ADDED: Handler for the new status switch
  const handleStatusChange = async (path: Path) => {
    const newStatus = path.status === 'open' ? 'closed' : 'open';
    try {
        await api.patch(`/admin/paths/${path._id}/status`, { status: newStatus });
        toast.success(`Path status updated to ${newStatus}.`);
        // Update local state for immediate UI feedback
        setPaths(prevPaths =>
            prevPaths.map(p =>
                p._id === path._id ? { ...p, status: newStatus } : p
            )
        );
    } catch (error) {
        handleApiError(error, 'update path status');
    }
  };

  // --- Render Logic ---
  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Paths</h1>
        <div className="flex gap-4">
          <Select onValueChange={setSelectedBuilding} value={selectedBuilding} disabled={loading.buildings}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder={loading.buildings ? "Loading buildings..." : "Select a building"} />
            </SelectTrigger>
            <SelectContent>
              {buildings.map(b => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={openModalForCreate} disabled={!selectedBuilding}>
            Create New Path
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead className="text-center">Distance (m)</TableHead>
              <TableHead className="text-center">Time (s)</TableHead>
              <TableHead className="text-center">Bidirectional</TableHead>
              <TableHead className="text-center">Status</TableHead> {/* <-- ADDED: Status column header */}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading.paths ? (
              <TableRow><TableCell colSpan={7} className="text-center h-24">Loading paths...</TableCell></TableRow>
            ) : paths.length > 0 ? (
              paths.map((path) => (
                <TableRow key={path._id}>
                  <TableCell className="font-medium">{path.from.name} (F{path.from.floor})</TableCell>
                  <TableCell className="font-medium">{path.to.name} (F{path.to.floor})</TableCell>
                  <TableCell className="text-center">{path.distance}</TableCell>
                  <TableCell className="text-center">{path.estimatedTime}</TableCell>
                  <TableCell className="text-center">{path.isBidirectional ? 'Yes' : 'No'}</TableCell>
                  {/* v-- ADDED: Status switch cell --v */}
                  <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                          <Switch
                              id={`status-${path._id}`}
                              checked={path.status === 'open'}
                              onCheckedChange={() => handleStatusChange(path)}
                              aria-label={`Set path status to ${path.status === 'open' ? 'closed' : 'open'}`}
                          />
                           <Label htmlFor={`status-${path._id}`} className="capitalize">
                              {path.status}
                          </Label>
                      </div>
                  </TableCell>
                  {/* ^-- ADDED: Status switch cell --^ */}
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openModalForEdit(path)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(path._id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                {!selectedBuilding ? "Please select a building to manage its paths." : "No paths found for this building."}
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{currentPath._id ? 'Edit Path' : 'Create New Path'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from">From Landmark</Label>
                    <Select name="from" value={currentPath.from} onValueChange={v => setCurrentPath(p => ({...p, from: v}))} required>
                        <SelectTrigger><SelectValue placeholder="Select starting point" /></SelectTrigger>
                        <SelectContent>
                            {landmarks.map(l => <SelectItem key={l._id} value={l._id} disabled={l._id === currentPath.to}>{l.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="to">To Landmark</Label>
                    <Select name="to" value={currentPath.to} onValueChange={v => setCurrentPath(p => ({...p, to: v}))} required>
                        <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                        <SelectContent>
                            {landmarks.map(l => <SelectItem key={l._id} value={l._id} disabled={l._id === currentPath.from}>{l.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="distance">Distance (meters)</Label>
                    <Input id="distance" name="distance" type="number" value={currentPath.distance} onChange={e => setCurrentPath(p => ({...p, distance: parseFloat(e.target.value)}))} required />
                  </div>
                   <div>
                    <Label htmlFor="estimatedTime">Estimated Time (seconds)</Label>
                    <Input id="estimatedTime" name="estimatedTime" type="number" value={currentPath.estimatedTime} onChange={e => setCurrentPath(p => ({...p, estimatedTime: parseInt(e.target.value, 10)}))} required />
                  </div>
              </div>
               <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea id="instructions" name="instructions" value={currentPath.instructions} onChange={e => setCurrentPath(p => ({...p, instructions: e.target.value}))} required />
              </div>
              <div className="flex items-center space-x-2">
                  <Checkbox id="isBidirectional" name="isBidirectional" checked={currentPath.isBidirectional} onCheckedChange={c => setCurrentPath(p => ({...p, isBidirectional: !!c}))} />
                  <Label htmlFor="isBidirectional">Path is Bidirectional</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit">{currentPath._id ? 'Save Changes' : 'Create Path'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPaths;