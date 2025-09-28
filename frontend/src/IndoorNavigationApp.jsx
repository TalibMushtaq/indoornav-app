import React, { useState, useEffect, useContext, createContext } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  User,
  Settings,
  Building,
  MapIcon,
  Clock,
  Star,
  Accessibility,
  Menu,
  X,
  ChevronRight,
  Plus,
  Target,
  AlertCircle,
  Loader,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  Camera,
  FolderOpen,
} from 'lucide-react';

// --- CONTEXT FOR GLOBAL STATE ---
const AppContext = createContext();

// Custom hook for easy context consumption
const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

// --- GLOBAL STATE PROVIDER ---
const AppProvider = ({ children }) => {
  // State variables
  const [user, setUser] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [imageUploading, setImageUploading] = useState(false);
  const [preferences, setPreferences] = useState({
    accessibilityMode: false,
    avoidStairs: false,
    language: 'en'
  });

  // Effect to auto-dismiss notifications
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ message: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // AWS S3 Configuration (Mock for demo - in production, use environment variables)
  const AWS_CONFIG = {
    bucketName: 'indoor-nav-images',
    region: 'us-west-2',
    accessKeyId: 'YOUR_ACCESS_KEY',
    secretAccessKey: 'YOUR_SECRET_KEY',
    cloudFrontUrl: 'https://d1234567890.cloudfront.net' // CDN for faster image delivery
  };

  // Mock AWS S3 operations (in production, use AWS SDK)
  const s3Operations = {
    uploadImage: async (file, folder = 'general') => {
      setImageUploading(true);
      try {
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate mock S3 URL
        const fileName = `${folder}/${Date.now()}-${file.name}`;
        const mockS3Url = `${AWS_CONFIG.cloudFrontUrl}/${fileName}`;
        
        setNotification({ message: 'Image uploaded successfully!', type: 'success' });
        return {
          url: mockS3Url,
          key: fileName,
          bucket: AWS_CONFIG.bucketName,
          size: file.size,
          contentType: file.type
        };
      } catch (error) {
        setNotification({ message: 'Upload failed: ' + error.message, type: 'error' });
        throw error;
      } finally {
        setImageUploading(false);
      }
    },

    deleteImage: async (imageKey) => {
      try {
        // Simulate delete operation
        await new Promise(resolve => setTimeout(resolve, 500));
        setNotification({ message: 'Image deleted successfully!', type: 'success' });
        return true;
      } catch (error) {
        setNotification({ message: 'Delete failed: ' + error.message, type: 'error' });
        throw error;
      }
    },

    getSignedUrl: (imageKey, expiresIn = 3600) => {
      // In production, generate actual signed URLs for private images
      return `${AWS_CONFIG.cloudFrontUrl}/${imageKey}?expires=${Date.now() + expiresIn * 1000}`;
    },

    listImages: async (folder = '') => {
      try {
        // Mock image list
        return [
          {
            key: `${folder}/floor-plan-1.jpg`,
            url: `${AWS_CONFIG.cloudFrontUrl}/${folder}/floor-plan-1.jpg`,
            lastModified: new Date(),
            size: 1024000
          },
          {
            key: `${folder}/landmark-photo-1.jpg`,
            url: `${AWS_CONFIG.cloudFrontUrl}/${folder}/landmark-photo-1.jpg`,
            lastModified: new Date(),
            size: 512000
          }
        ];
      } catch (error) {
        setNotification({ message: 'Failed to list images: ' + error.message, type: 'error' });
        throw error;
      }
    }
  };

  // Mock API call function with S3 integration
  const apiCall = async (endpoint, options = {}) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock responses based on endpoint
      if (endpoint.includes('/navigation/search')) {
        const query = new URLSearchParams(endpoint.split('?')[1]).get('q');
        return {
          landmarks: [
            { 
              _id: '1', 
              name: `${query} Room 101`, 
              type: 'classroom', 
              floor: 1,
              image: `${AWS_CONFIG.cloudFrontUrl}/landmarks/room-101.jpg`,
              floorPlan: `${AWS_CONFIG.cloudFrontUrl}/floor-plans/floor-1.jpg`
            },
            { 
              _id: '2', 
              name: `${query} Lab 205`, 
              type: 'laboratory', 
              floor: 2,
              image: `${AWS_CONFIG.cloudFrontUrl}/landmarks/lab-205.jpg`,
              floorPlan: `${AWS_CONFIG.cloudFrontUrl}/floor-plans/floor-2.jpg`
            },
            { 
              _id: '3', 
              name: `${query} Office 301`, 
              type: 'office', 
              floor: 3,
              image: `${AWS_CONFIG.cloudFrontUrl}/landmarks/office-301.jpg`,
              floorPlan: `${AWS_CONFIG.cloudFrontUrl}/floor-plans/floor-3.jpg`
            }
          ]
        };
      }
      
      if (endpoint === '/navigation/route') {
        // Simulate checking options for POST request
        const body = options.body ? JSON.parse(options.body) : {};
        console.log('Calculating route with preferences:', body.preferences);

        return {
          steps: [
            { instruction: 'Exit the current room and turn right', distance: 10 },
            { instruction: 'Walk straight down the hallway', distance: 50 },
            // Add a step that might involve stairs/accessibility preference
            ...(body.preferences?.avoidStairs ? 
                [{ instruction: 'Take the elevator to the next floor', distance: 15 }] : 
                [{ instruction: 'Take the stairs to the next floor', distance: 10 }]
            ),
            { instruction: 'Turn left at the intersection', distance: 5 },
            { instruction: 'Enter the destination room on your left', distance: 15 }
          ],
          totalDistance: body.preferences?.avoidStairs ? 95 : 90,
          estimatedTime: body.preferences?.avoidStairs ? 3 : 2
        };
      }
      
      if (endpoint === '/navigation/popular') {
        return {
          destinations: [
            { 
              _id: '1', 
              name: 'Library', 
              type: 'facility',
              image: `${AWS_CONFIG.cloudFrontUrl}/landmarks/library.jpg`
            },
            { 
              _id: '2', 
              name: 'Cafeteria', 
              type: 'dining',
              image: `${AWS_CONFIG.cloudFrontUrl}/landmarks/cafeteria.jpg`
            },
            { 
              _id: '3', 
              name: 'Main Auditorium', 
              type: 'venue',
              image: `${AWS_CONFIG.cloudFrontUrl}/landmarks/auditorium.jpg`
            }
          ]
        };
      }
      
      if (endpoint === '/users/me') {
        return { name: 'Demo User', id: '123' };
      }
      
      return {};
    } catch (error) {
      setNotification({ message: 'API Error: ' + error.message, type: 'error' });
      throw error;
    }
  };

  // Mock session check (removed localStorage dependency)
  useEffect(() => {
    // Simulate having a logged-in user for demo
    setUser({ name: 'Demo User', id: '123' });
  }, []);

  const value = {
    user,
    setUser,
    currentLocation,
    setCurrentLocation,
    destination,
    setDestination,
    route,
    setRoute,
    buildings,
    setBuildings,
    isNavigating,
    setIsNavigating,
    preferences,
    setPreferences,
    notification,
    setNotification,
    apiCall,
    s3Operations,
    imageUploading,
    AWS_CONFIG
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// --- UI COMPONENTS ---

const NotificationBanner = () => {
  const { notification, setNotification } = useAppContext();

  if (!notification.message) return null;

  const isError = notification.type === 'error';
  const bgColor = isError ? 'bg-red-100 border-red-400' : 'bg-green-100 border-green-400';
  const textColor = isError ? 'text-red-800' : 'text-green-800';
  const Icon = isError ? AlertCircle : CheckCircle;

  return (
    <div className={`fixed top-5 right-5 z-50 p-4 rounded-lg border ${bgColor} flex items-center shadow-lg`}>
      <Icon className={`w-5 h-5 mr-3 ${textColor}`} />
      <span className={`text-sm font-medium ${textColor}`}>{notification.message}</span>
      <button onClick={() => setNotification({ message: '', type: '' })} className="ml-4">
        <X className={`w-5 h-5 ${textColor}`} />
      </button>
    </div>
  );
};

const Header = ({ onMenuClick }) => {
  const { user, setUser } = useAppContext();

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={onMenuClick} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">IndoorNav</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 hidden sm:inline">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Guest Mode</span>
              <User className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// IndoorNavigationApp.jsx (Sidebar component - CORRECTED)
const Sidebar = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState('navigate');
  // Use context to get and set preferences
  const { preferences, setPreferences } = useAppContext();

  const menuItems = [
    { id: 'navigate', label: 'Navigate', icon: Navigation },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'buildings', label: 'Buildings', icon: Building },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const SettingsPanel = () => (
    <div className="p-4 space-y-4">
      <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Navigation Settings</h3>
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={preferences.accessibilityMode}
            onChange={(e) => setPreferences(prev => ({ ...prev, accessibilityMode: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Accessibility mode</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={preferences.avoidStairs}
            onChange={(e) => setPreferences(prev => ({ ...prev, avoidStairs: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Avoid stairs</span>
        </label>
      </div>
    </div>
  );

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={onClose} />}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="md:hidden flex justify-end p-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <nav className="px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        {/* Conditional rendering for sidebar content */}
        {activeSection === 'settings' && <SettingsPanel />}
        {activeSection !== 'settings' && (
             <div className="p-4 text-sm text-gray-500">
                {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} functionality goes here.
             </div>
        )}
      </aside>
    </>
  );
};

const SearchBox = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { apiCall, setDestination } = useAppContext();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await apiCall(`/navigation/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(results.landmarks || []);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectDestination = (landmark) => {
    setDestination(landmark);
    setSearchQuery(landmark.name);
    setSearchResults([]);
  };

  return (
    <div className="relative">
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for rooms, facilities..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
        >
          {isSearching ? <Loader className="w-5 h-5 animate-spin" /> : 'Search'}
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
          {searchResults.map((landmark) => (
            <button
              key={landmark._id}
              onClick={() => selectDestination(landmark)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{landmark.name}</div>
                  <div className="text-sm text-gray-500">{landmark.type} • Floor {landmark.floor}</div>
                </div>
                {landmark.image && (
                  <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={landmark.image} 
                      alt={landmark.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Image Upload Component
const ImageUploadModal = ({ isOpen, onClose, onUpload, folder = 'general' }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const { s3Operations, imageUploading } = useAppContext();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    } else {
      alert('Please select a valid image file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      const result = await s3Operations.uploadImage(selectedFile, folder);
      onUpload(result);
      setSelectedFile(null);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold">Upload Image</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium">Drop image here</p>
                  <p className="text-gray-500">or click to browse</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFile(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <label 
                  htmlFor="file-upload"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
                >
                  Choose File
                </label>
              </div>
            )}
          </div>
          
          {selectedFile && (
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setSelectedFile(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={imageUploading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {imageUploading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Floor Plan Viewer Component
const FloorPlanViewer = ({ floorPlanUrl, currentLocation, destination, onClose }) => {
  if (!floorPlanUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-full overflow-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Floor Plan</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="relative">
            <img 
              src={floorPlanUrl} 
              alt="Floor Plan"
              className="w-full h-auto rounded-lg"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTAwSDMwMFYyMDBIMjAwVjEwMFoiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeD0iMTg4IiB5PSIxMzgiPgo8cGF0aCBkPSJNOSAyMUgxNUMxNSAyMS41IDEzLjUgMjIgMTIgMjJDMTAuNSAyMiA5IDIxLjUgOSAyMVoiIGZpbGw9IiM2QjdCODAiLz4KPHN2Zz4K';
              }}
            />
            
            {/* Location markers overlay */}
            {currentLocation && (
              <div className="absolute top-4 left-4 bg-green-500 text-white px-2 py-1 rounded-lg text-sm font-medium">
                📍 Current Location
              </div>
            )}
            
            {destination && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-medium">
                🎯 Destination
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- CORRECTED COMPONENT: NavigationPanel ---
const NavigationPanel = () => {
  // Local state variables for the component
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  
  const {
    currentLocation,
    setCurrentLocation,
    destination,
    route,
    setRoute,
    isNavigating,
    setIsNavigating,
    apiCall,
    preferences,
    setPreferences,
    s3Operations,
  } = useAppContext();

  const calculateRoute = async () => {
    if (!currentLocation || !destination) return;
    setIsCalculatingRoute(true);
    setRoute(null);
    try {
      const routeData = await apiCall('/navigation/route', {
        method: 'POST',
        body: JSON.stringify({
          startLandmarkId: currentLocation._id,
          endLandmarkId: destination._id,
          preferences: {
            wheelchair: preferences.accessibilityMode,
            avoidStairs: preferences.avoidStairs
          }
        })
      });
      setRoute(routeData);
      setCurrentStep(0);
    } catch (error) {
      // Global handler will show notification
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const startNavigation = () => route && setIsNavigating(true);
  const stopNavigation = () => {
    setIsNavigating(false);
    setRoute(null);
  };
  const nextStep = () => route && currentStep < route.steps.length - 1 && setCurrentStep(s => s + 1);
  const prevStep = () => currentStep > 0 && setCurrentStep(s => s - 1);

  // Mock current location for demo
  const setMockCurrentLocation = () => {
    setCurrentLocation({ 
      _id: 'current', 
      name: 'Current Location', 
      type: 'location', 
      floor: 1,
      image: null,
      floorPlan: `https://d1234567890.cloudfront.net/floor-plans/floor-1.jpg`
    });
  };

  const handleImageUpload = (result) => {
    setUploadedImages(prev => [...prev, result]);
    // Here you would typically associate the image with a specific landmark or location
  };

  const viewFloorPlan = () => {
    if (destination?.floorPlan || currentLocation?.floorPlan) {
      setShowFloorPlan(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Navigation</h2>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Location</label>
          {currentLocation ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">{currentLocation.name}</span>
              </div>
              <button onClick={() => setCurrentLocation(null)} className="text-green-600 hover:text-green-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={setMockCurrentLocation}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Set current location
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
          <SearchBox />
          {destination && destination.image && (
            <div className="mt-3">
              <img 
                src={destination.image} 
                alt={destination.name}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </div>

      {currentLocation && destination && !route && (
        <div className="mb-6 space-y-3">
          <button
            onClick={calculateRoute}
            disabled={isCalculatingRoute}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isCalculatingRoute ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Calculating Route...</span>
              </>
            ) : (
              <>
                <MapIcon className="w-5 h-5" />
                <span>Calculate Route</span>
              </>
            )}
          </button>
          
          <button
            onClick={viewFloorPlan}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2"
          >
            <FolderOpen className="w-4 h-4" />
            <span>View Floor Plan</span>
          </button>
        </div>
      )}

      {route && (
        <div className="mb-6">
          {!isNavigating ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900">Route Found</h3>
                <p className="text-sm text-blue-800">{route.steps.length} steps • {Math.round(route.totalDistance)}m • ~{Math.round(route.estimatedTime)} min</p>
              </div>
              <button onClick={startNavigation} className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2">
                <Navigation className="w-5 h-5" />
                <span>Start Navigation</span>
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Step {currentStep + 1} of {route.steps.length}</h4>
                <button onClick={stopNavigation} className="text-red-600 hover:text-red-800"><X className="w-5 h-5" /></button>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Target className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">{route.steps[currentStep]?.instruction}</p>
                    <p className="text-sm text-yellow-700 mt-1">Distance: {route.steps[currentStep]?.distance}m</p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button onClick={prevStep} disabled={currentStep === 0} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50">Previous</button>
                <button onClick={nextStep} disabled={currentStep === route.steps.length - 1} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Next</button>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${((currentStep + 1) / route.steps.length) * 100}%` }}></div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Image Management Section */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-gray-900">Images & Floor Plans</h3>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>
        </div>
        
        {uploadedImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {uploadedImages.slice(-4).map((img, index) => (
              <div key={index} className="relative">
                <img 
                  src={img.url} 
                  alt="Uploaded" 
                  className="w-full h-16 object-cover rounded border"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAyNEM0MCAyNCA0MCAzNiAzMiAzNkMyNCAzNiAyNCAyNCAzMiAyNFoiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeD0iMjQiIHk9IjI0Ij4KPHN2Zz4K';
                  }}
                />
                <button
                  onClick={() => s3Operations.deleteImage(img.key)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No images uploaded yet</p>
        )}
      </div>

      <ImageUploadModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleImageUpload}
        folder="landmarks"
      />

      <FloorPlanViewer
        floorPlanUrl={destination?.floorPlan || currentLocation?.floorPlan}
        currentLocation={currentLocation}
        destination={destination}
        onClose={() => setShowFloorPlan(false)}
      />
    </div>
  );
};

const QuickActions = () => {
  const { apiCall, setDestination } = useAppContext();
  const [popularDestinations, setPopularDestinations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPopularDestinations = async () => {
      setIsLoading(true);
      try {
        const data = await apiCall('/navigation/popular');
        setPopularDestinations(data.destinations || []);
      } catch (error) {
        // The global notification will handle the error message
      } finally {
        setIsLoading(false);
      }
    };
    fetchPopularDestinations();
  }, [apiCall]);

  const quickActionButtons = [
    { label: 'Emergency Exit', icon: AlertCircle, color: 'red' },
    { label: 'Restrooms', icon: User, color: 'blue' },
    { label: 'Elevators', icon: Building, color: 'green' },
    { label: 'Information Desk', icon: Target, color: 'purple' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {quickActionButtons.map((action) => {
            const Icon = action.icon;
            const colorClasses = {
              red: 'bg-red-50 text-red-700 border-red-200',
              blue: 'bg-blue-50 text-blue-700 border-blue-200',
              green: 'bg-green-50 text-green-700 border-green-200',
              purple: 'bg-purple-50 text-purple-700 border-purple-200'
            };
            return (
              <button
                key={action.label}
                // Simulate setting a destination for demonstration
                onClick={() => setDestination({
                    _id: action.label,
                    name: action.label,
                    type: 'facility',
                    floor: 1, // Assume ground floor for quick actions
                    image: null,
                    floorPlan: `https://d1234567890.cloudfront.net/floor-plans/floor-1.jpg`
                })}
                className={`p-3 rounded-lg border text-center ${colorClasses[action.color]} hover:opacity-80`}
              >
                <Icon className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <Loader className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : (
          popularDestinations.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Popular Destinations</h3>
              <div className="space-y-2">
                {popularDestinations.slice(0, 3).map((dest) => (
                  <button
                    key={dest._id}
                    onClick={() => setDestination(dest)}
                    className="w-full text-left p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{dest.name}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
const IndoorNavigationApp = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // Sidebar is open by default on larger screens (md: or 768px)
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    
    // Set initial state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50 font-sans">
        <NotificationBanner />
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <NavigationPanel />
                </div>
                <div>
                  <QuickActions />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AppProvider>
  );
};

export default IndoorNavigationApp;