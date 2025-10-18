import { useEffect, useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  PlusCircle,
  MapPin,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/components/ui/use-toast';
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
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiCallWithAuth, apiDelete } from '@/utils/api';

/**
 * Interface for Landmark data structure
 */
interface ILandmark {
  _id: string;
  name: string;
  type: string;
  floor: string;
  building?: {
    _id: string;
    name: string;
  };
  images?: { url: string }[];
}

/**
 * Interface for pagination metadata from the API
 */
interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * AdminLandmarks Component
 * 
 * Displays a paginated list of landmarks with CRUD operations.
 * Features:
 * - Pagination with customizable items per page
 * - Image preview with fallback placeholders
 * - Delete confirmation dialog
 * - Responsive grid layout
 * - Smooth page transitions
 * 
 * @returns {JSX.Element} The landmarks management interface
 */
const AdminLandmarks = () => {
  // ==================== STATE MANAGEMENT ====================
  const [landmarks, setLandmarks] = useState<ILandmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const { toast } = useToast();

  // ==================== DATA FETCHING ====================
  
  /**
   * Fetches landmarks from the API with pagination
   * Wrapped in useCallback to prevent unnecessary re-renders and function recreations
   * 
   * @param {number} page - The page number to fetch (default: currentPage)
   * @param {number} limit - Number of items per page (default: itemsPerPage)
   */
  const fetchLandmarks = useCallback(
    async (page: number = currentPage, limit: number = itemsPerPage) => {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      try {
        const response = await apiCallWithAuth(
          `/admin/landmarks?page=${page}&limit=${limit}`,
          token
        );

        const data = await response.json();
        
        // Check response status after parsing to access error messages
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch landmarks.');
        }

        setLandmarks(data.data.landmarks);
        // Provide fallback pagination data in case API doesn't return it
        setPagination(
          data.pagination || { total: 0, page, limit, totalPages: 1 }
        );
        setError(null); // Clear any previous errors on success
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, itemsPerPage]
  );

  /**
   * Effect to fetch landmarks when page or items per page changes
   * Uses cleanup flag to prevent race conditions and duplicate fetches
   * This is particularly important when dependencies change rapidly
   */
  useEffect(() => {
    let ignore = false; // Flag to prevent state updates after unmount
    
    (async () => {
      if (!ignore) {
        await fetchLandmarks(currentPage, itemsPerPage);
      }
    })();
    
    // Cleanup function to set ignore flag when component unmounts or deps change
    return () => {
      ignore = true;
    };
  }, [fetchLandmarks, currentPage, itemsPerPage]);

  // ==================== EVENT HANDLERS ====================
  
  /**
   * Handles landmark deletion with proper error handling and pagination adjustment
   * If the last item on a page is deleted, navigates to the previous page
   * 
   * @param {string} landmarkId - The ID of the landmark to delete
   */
  const handleDelete = async (landmarkId: string) => {
    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await apiDelete(`/admin/landmarks/${landmarkId}`, token!);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete landmark.');
      }

      toast({
        title: 'Success!',
        description: 'Landmark has been deleted.',
      });

      // Smart pagination: go to previous page if last item was deleted
      if (landmarks.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        // Refresh current page after deletion
        fetchLandmarks(currentPage, itemsPerPage);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  /**
   * Handles page navigation with smooth scroll to top
   * 
   * @param {number} newPage - The page number to navigate to
   */
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Handles items per page selection change
   * Resets to page 1 when limit changes to avoid showing empty pages
   * 
   * @param {string} newLimit - The new items per page limit as a string
   */
  const handleLimitChange = (newLimit: string) => {
    setItemsPerPage(Number(newLimit));
    setCurrentPage(1); // Reset to first page on limit change
  };

  // ==================== HELPER FUNCTIONS ====================
  
  /**
   * Generates an array of page numbers to display in pagination controls
   * Shows a maximum of 5 consecutive page numbers centered around current page
   * 
   * @returns {number[]} Array of page numbers to display
   */
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Maximum number of page buttons to show
    
    // Calculate start and end page for the visible range
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // Build array of page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  // ==================== LOADING & ERROR STATES ====================
  
  // Show loading state only when there are no landmarks to display
  if (loading && landmarks.length === 0) {
    return (
      <AdminLayout>
        <p>Loading landmarks...</p>
      </AdminLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <AdminLayout>
        <p className="text-destructive">Error: {error}</p>
      </AdminLayout>
    );
  }

  // ==================== MAIN RENDER ====================
  
  return (
    <AdminLayout>
      {/* Loading Overlay for Page Transitions */}
      {loading && landmarks.length > 0 && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-sm font-medium">Loading landmarks...</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Manage Landmarks</h1>
          <p className="text-muted-foreground mt-1">
            Total: {pagination.total} landmark
            {pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <NavLink to="/admin/landmarks/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Landmark
          </NavLink>
        </Button>
      </div>

      {/* Items Per Page Selector */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-muted-foreground">Show:</span>
        <Select value={itemsPerPage.toString()} onValueChange={handleLimitChange}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6">6</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">per page</span>
      </div>

      {/* Landmarks Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {landmarks.length > 0 ? (
          landmarks.map((landmark) => {
            const imageUrl = landmark.images?.[0]?.url;
            // Generate placeholder with landmark name encoded in URL
            const placeholderUrl = `https://placehold.co/600x400/E2E8F0/4A5568?text=${encodeURIComponent(
              landmark.name
            )}`;

            return (
              <Card key={landmark._id} className="overflow-hidden">
                {/* Landmark Image with Fallback */}
                <img
                  src={imageUrl || placeholderUrl}
                  alt={landmark.name}
                  className="w-full h-40 object-cover bg-muted"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.currentTarget.src = placeholderUrl;
                  }}
                />
                
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {landmark.name}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center">
                      {/* Edit Button */}
                      <Button variant="ghost" size="icon" asChild>
                        <NavLink to={`/admin/landmarks/edit/${landmark._id}`}>
                          <Edit className="h-4 w-4" />
                        </NavLink>
                      </Button>
                      
                      {/* Delete Button with Confirmation Dialog */}
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
                              This action will delete the landmark "
                              {landmark.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(landmark._id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardTitle>
                  
                  <CardDescription>
                    {landmark.building?.name || 'Unknown Building'} - Floor{' '}
                    {landmark.floor}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <p>
                    Type:{' '}
                    <span className="font-medium capitalize">
                      {landmark.type.replace(/_/g, ' ')}
                    </span>
                  </p>
                </CardContent>
              </Card>
            );
          })
        ) : (
          /* Empty State */
          <div className="col-span-full text-center p-8 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No Landmarks Found</h3>
            <p className="text-muted-foreground mt-2">
              Get started by adding your first landmark.
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls - Only show if there are multiple pages */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          {/* Results Counter */}
          <div className="text-sm text-muted-foreground">
            {pagination.total > 0
              ? `Showing ${((currentPage - 1) * itemsPerPage) + 1} to ${Math.min(
                  currentPage * itemsPerPage,
                  pagination.total
                )} of ${pagination.total} results`
              : 'No results to display'}
          </div>

          {/* Pagination Buttons */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {/* Page Number Buttons */}
            <div className="flex items-center gap-1">
              {/* Show first page and ellipsis if current page is far from start */}
              {currentPage > 2 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={loading}
                  >
                    1
                  </Button>
                  {currentPage > 3 && <span className="px-2">...</span>}
                </>
              )}

              {/* Show page numbers around current page */}
              {getPageNumbers().map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  disabled={loading}
                >
                  {pageNum}
                </Button>
              ))}

              {/* Show ellipsis and last page if current page is far from end */}
              {currentPage < pagination.totalPages - 1 && (
                <>
                  {currentPage < pagination.totalPages - 2 && (
                    <span className="px-2">...</span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={loading}
                  >
                    {pagination.totalPages}
                  </Button>
                </>
              )}
            </div>

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminLandmarks;