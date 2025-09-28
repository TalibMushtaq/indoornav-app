import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  User,
  Settings,
  Building,
  Clock,
  Star,
  Menu,
  X,
  ChevronRight,
  Plus,
  Target,
  AlertCircle,
  Loader,
  CheckCircle,
} from 'lucide-react';

// Context for global state
const AppContext = createContext();

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ message: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Mock session check
  useEffect(() => {
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
    isNavigating,
    setIsNavigating,
    notification,
    setNotification,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

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

const Header = () => {
  const { user, setUser } = useAppContext();

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
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
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
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

const SearchBox = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { setDestination } = useAppContext();

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    // Mock search result
    const mockDestination = {
      _id: '1',
      name: searchQuery,
      type: 'room',
      floor: 1,
    };
    
    setDestination(mockDestination);
    setSearchQuery('');
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
      </div>
    </div>
  );
};

const NavigationPanel = () => {
  const {
    currentLocation,
    setCurrentLocation,
    destination,
    route,
    setRoute,
    isNavigating,
    setIsNavigating,
  } = useAppContext();

  const calculateRoute = () => {
    if (!currentLocation || !destination) return;
    
    // Mock route
    const mockRoute = {
      steps: [
        { instruction: 'Exit the current room and turn right', distance: 10 },
        { instruction: 'Walk straight down the hallway', distance: 50 },
        { instruction: 'Turn left at the intersection', distance: 5 },
        { instruction: 'Enter the destination room on your left', distance: 15 }
      ],
      totalDistance: 80,
      estimatedTime: 2
    };
    
    setRoute(mockRoute);
  };

  const startNavigation = () => route && setIsNavigating(true);
  const stopNavigation = () => {
    setIsNavigating(false);
    setRoute(null);
  };

  const setMockCurrentLocation = () => {
    setCurrentLocation({ 
      _id: 'current', 
      name: 'Current Location', 
      type: 'location', 
      floor: 1,
    });
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
          {destination && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">{destination.name}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {currentLocation && destination && !route && (
        <button
          onClick={calculateRoute}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
        >
          <Navigation className="w-5 h-5" />
          <span>Calculate Route</span>
        </button>
      )}

      {route && !isNavigating && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900">Route Found</h3>
            <p className="text-sm text-blue-800">{route.steps.length} steps • {route.totalDistance}m • ~{route.estimatedTime} min</p>
          </div>
          <button onClick={startNavigation} className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2">
            <Navigation className="w-5 h-5" />
            <span>Start Navigation</span>
          </button>
        </div>
      )}

      {isNavigating && route && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Navigation Active</h4>
            <button onClick={stopNavigation} className="text-red-600 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Target className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Follow the route to your destination</p>
                <p className="text-sm text-yellow-700 mt-1">Total distance: {route.totalDistance}m</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QuickActions = () => {
  const { setDestination } = useAppContext();

  const quickActions = [
    { label: 'Library', icon: Building },
    { label: 'Cafeteria', icon: User },
    { label: 'Elevators', icon: Building },
    { label: 'Information Desk', icon: Target }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => setDestination({
                _id: action.label,
                name: action.label,
                type: 'facility',
                floor: 1,
              })}
              className="p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-center hover:bg-blue-100"
            >
              <Icon className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50 font-sans">
        <NotificationBanner />
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
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
    </AppProvider>
  );
}

export default App;