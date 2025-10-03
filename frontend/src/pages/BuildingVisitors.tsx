import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Users, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import AdminLayout from '../components/AdminLayout';
import { apiCallWithAuth } from '@/utils/api'; 

const useAuth = () => ({
  token: localStorage.getItem('adminToken')
});

interface Visitor {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
  building: {
    _id: string;
    name: string;
  } | null;
  createdAt: string;
}

const BuildingVisitors = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchVisitors = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }

      
      const response = await apiCallWithAuth('/visitors', token);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setVisitors(result.data);
      } else {
        throw new Error(result.message || 'An unknown error occurred');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
    
  }, []);

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 md:p-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-muted rounded-md">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Building Visitor Logs</CardTitle>
                  <CardDescription>A complete record of all visitor registrations.</CardDescription>
                </div>
              </div>
              <Button onClick={fetchVisitors} disabled={loading} variant="outline" className="w-full md:w-auto">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="ml-2">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Fetching Data</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor Name</TableHead>
                    <TableHead>Building Visited</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="hidden lg:table-cell">Address</TableHead>
                    <TableHead className="text-right">Registration Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <p>Loading visitor data...</p>
                      </TableCell>
                    </TableRow>
                  ) : visitors.length > 0 ? (
                    visitors.map((visitor) => (
                      <TableRow key={visitor._id}>
                        <TableCell className="font-medium">{visitor.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{visitor.building?.name || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{visitor.phone || '—'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{visitor.address || '—'}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {format(new Date(visitor.createdAt), "MMM d, yyyy, h:mm a")}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No visitor logs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default BuildingVisitors;