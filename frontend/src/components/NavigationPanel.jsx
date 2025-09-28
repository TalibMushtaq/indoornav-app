import React, { useState } from "react";

const NavigationPanel = () => {
  const [location, setLocation] = useState("");
  const [destination, setDestination] = useState("");

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Navigation</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Current Location</label>
        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Enter your location"
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Destination</label>
        <input
          type="text"
          value={destination}
          onChange={e => setDestination(e.target.value)}
          placeholder="Search for rooms, facilities..."
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
      </div>
    </div>
  );
};

export default NavigationPanel;
