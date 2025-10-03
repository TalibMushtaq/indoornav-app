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
  DialogDescription,
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { apiCallWithAuth } from '@/utils/api'; // ✅ Use your existing API utility

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
  reverseInstructions?: string;
  status: 'open' | 'closed' | 'restricted';
}

type PathFormData = {
  _id: string | null;
  from: string;
  to: string;
  distance: number;
  estimatedTime: number;
  instructions: string;
  reverseInstructions: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isBidirectional: boolean;
  status: 'open' | 'closed' | 'restricted';
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
  reverseInstructions: '',
  difficulty: 'easy',
  isBidirectional: true,
  status: 'open',
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
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'processing'>('idle');

  // Get token once
  const token = localStorage.getItem('adminToken') || '';

  // --- Reusable Error Handler ---
  const handleApiError = useCallback((error: unknown, context: string) => {
    let errorMessage = `Failed to ${context}.`;
    if (error instanceof Error) {
      errorMessage = error.message || errorMessage;
    }
    console.error(`Error (${context}):`, error);
    toast.error(errorMessage);
  }, []);

  // --- Data Fetching Logic ---
  const fetchBuildings = useCallback(async () => {
    setLoading(prev => ({ ...prev, buildings: true }));
    try {
      const response = await apiCallWithAuth('/admin/buildings?limit=100', token);
      if (!response.ok) {
        throw new Error('Failed to fetch buildings');
      }
      const data = await response.json();
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
  }, [handleApiError, token]);

  const fetchLandmarks = useCallback(async (buildingId: string) => {
    try {
      const response = await apiCallWithAuth(`/navigation/buildings/${buildingId}/landmarks`, token);
      if (!response.ok) throw new Error('Failed to fetch landmarks');
      const data = await response.json();
      setLandmarks(data.success ? data.data.landmarks || [] : []);
    } catch (error) {
      handleApiError(error, 'fetch landmarks');
      setLandmarks([]);
    }
  }, [handleApiError, token]);

  const fetchPaths = useCallback(async (buildingId: string) => {
    setLoading(prev => ({ ...prev, paths: true }));
    try {
      const response = await apiCallWithAuth(`/admin/paths?building=${buildingId}&limit=100`, token);
      if (!response.ok) throw new Error('Failed to fetch paths');
      const data = await response.json();
      setPaths(data.success ? data.data.paths || [] : []);
    } catch (error) {
      handleApiError(error, 'fetch paths');
      setPaths([]);
    } finally {
      setLoading(prev => ({ ...prev, paths: false }));
    }
  }, [handleApiError, token]);

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
      reverseInstructions: path.reverseInstructions || '',
      isBidirectional: path.isBidirectional,
      status: path.status || 'open',
      difficulty: 'easy',
      accessibility: { wheelchairAccessible: true, requiresStairs: false },
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionStatus('processing');

    const { _id, ...pathData } = currentPath;

    const submissionData = {
      ...pathData,
      distance: String(pathData.distance),
      estimatedTime: String(pathData.estimatedTime),
      isBidirectional: String(pathData.isBidirectional),
      accessibility: JSON.stringify(pathData.accessibility),
    };

    try {
      const response = _id
        ? await apiCallWithAuth(`/admin/paths/${_id}`, token, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData),
          })
        : await apiCallWithAuth('/admin/paths', token, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData),
          });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save path');
      }

      const result = await response.json();
      toast.success(result.message || `Path ${_id ? 'updated' : 'created'} successfully!`);
      setIsModalOpen(false);
      if (selectedBuilding) {
        fetchPaths(selectedBuilding);
      }
    } catch (error) {
      handleApiError(error, _id ? 'update path' : 'create path');
    } finally {
      setSubmissionStatus('idle');
    }
  };

  const handleDelete = async (pathId: string) => {
    if (!window.confirm('Are you sure you want to delete this path? This action cannot be undone.')) return;
    try {
      const response = await apiCallWithAuth(`/admin/paths/${pathId}`, token, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete path');
      toast.success('Path deleted successfully!');
      fetchPaths(selectedBuilding);
    } catch (error) {
      handleApiError(error, 'delete path');
    }
  };

  const handleStatusChange = async (path: Path) => {
    const newStatus = path.status === 'open' ? 'closed' : 'open';
    try {
      const response = await apiCallWithAuth(`/admin/paths/${path._id}/status`, token, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      toast.success(`Path status updated to ${newStatus}.`);
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
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading.paths ? (
              <TableRow><TableCell colSpan={5} className="text-center h-24">Loading paths...</TableCell></TableRow>
            ) : paths.length > 0 ? (
              paths.map((path) => (
                <TableRow key={path._id}>
                  <TableCell className="font-medium">{path.from.name} (F{path.from.floor})</TableCell>
                  <TableCell className="font-medium">{path.to.name} (F{path.to.floor})</TableCell>
                  <TableCell className="text-center">{path.distance}</TableCell>
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
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openModalForEdit(path)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(path._id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                {!selectedBuilding ? "Please select a building to manage its paths." : "No paths found for this building."}
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        setIsModalOpen(isOpen);
        if (!isOpen) setSubmissionStatus('idle');
      }}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{currentPath._id ? 'Edit Path' : 'Create New Path'}</DialogTitle>
            <DialogDescription>
              AI will automatically standardize instructions and generate a reverse path if bidirectional.
            </DialogDescription>
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
                  <Input id="distance" name="distance" type="number" value={currentPath.distance} onChange={e => setCurrentPath(p => ({...p, distance: parseFloat(e.target.value) || 0}))} required />
                </div>
                <div>
                  <Label htmlFor="estimatedTime">Estimated Time (seconds)</Label>
                  <Input id="estimatedTime" name="estimatedTime" type="number" value={currentPath.estimatedTime} onChange={e => setCurrentPath(p => ({...p, estimatedTime: parseInt(e.target.value, 10) || 0}))} required />
                </div>
              </div>
               
              <div className="grid gap-2">
                <Label htmlFor="instructions">Instructions (A to B)</Label>
                <Textarea id="instructions" name="instructions" value={currentPath.instructions} onChange={e => setCurrentPath(p => ({...p, instructions: e.target.value}))} required minLength={10} />
                <p className="text-sm text-muted-foreground">This text will be standardized by AI upon saving. (Min. 10 characters)</p>
              </div>

              {currentPath.isBidirectional && (
                <div className="grid gap-2">
                  <Label htmlFor="reverseInstructions">Reverse Instructions (B to A)</Label>
                  <Textarea id="reverseInstructions" name="reverseInstructions" value={currentPath.reverseInstructions} onChange={e => setCurrentPath(p => ({...p, reverseInstructions: e.target.value}))} />
                  <p className="text-sm text-muted-foreground">
                    {currentPath._id 
                      ? "You can manually edit the reverse instructions here."
                      : "This will be auto-generated by AI when you create the path."
                    }
                  </p>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Checkbox id="isBidirectional" name="isBidirectional" checked={currentPath.isBidirectional} onCheckedChange={c => setCurrentPath(p => ({...p, isBidirectional: !!c}))} />
                <Label htmlFor="isBidirectional">Path is Bidirectional</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submissionStatus === 'processing'}>Cancel</Button>
              <Button type="submit" disabled={submissionStatus === 'processing'}>
                {submissionStatus === 'processing' && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {submissionStatus === 'processing' 
                  ? 'Processing with AI...' 
                  : (currentPath._id ? 'Save Changes' : 'Create Path')
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPaths;