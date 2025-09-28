import React, { useState, createContext, useContext } from 'react';
import { Search, Building, Target } from 'lucide-react';
import Navbar from './components/Navbar';
import AppRoutes from './components/AppRoutes';
import { Routes, Route } from "react-router-dom";
import AdminSignIn from "./components/AdminSignIn";
import AdminSignUp from "./components/AdminSignUp";

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
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(null);

  const value = {
    currentLocation,
    setCurrentLocation,
    destination,
    setDestination
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// ...existing code...

const SearchBox = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { setDestination } = useAppContext();

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setDestination({
      name: searchQuery,
      type: 'room'
    });
    setSearchQuery('');
  };

  return (
    <div className="mt-1 relative">
      <input
        type="text"
        placeholder="Search for rooms, facilities..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        className="w-full p-2 border border-gray-300 rounded-lg pr-10"
      />
      <button
        onClick={handleSearch}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500"
      >
        <Search className="w-5 h-5" />
      </button>
    </div>
  );
};

const NavigationPanel = () => {
  const { setCurrentLocation } = useAppContext();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-xl font-bold mb-4">Navigation</h2>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Current Location</label>
            <button 
              onClick={() => setCurrentLocation({ name: 'Current Location', type: 'location' })}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Set current location
            </button>
          </div>
          <div className="mt-1 p-2 w-full border border-gray-300 rounded-lg bg-white">
            Click to set location
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Destination</label>
          <SearchBox />
        </div>
      </div>
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
    <div>
      <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => setDestination({
                name: action.label,
                type: 'facility'
              })}
              className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <span className="text-sm">{action.label}</span>
              <Icon className="w-5 h-5 text-gray-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

function App() {
  return ( 
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={
            <>
              <div className="shadow-lg rounded-xl bg-white p-6 mb-8">
                <NavigationPanel />
              </div>
              <div className="shadow-lg rounded-xl bg-white p-6">
                <QuickActions />
              </div>
            </>
          } />
          <Route path="/admin/signin" element={<AdminSignIn />} />
          <Route path="/admin/signup" element={<AdminSignUp />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;