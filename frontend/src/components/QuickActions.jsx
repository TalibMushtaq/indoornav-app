import React from "react";

const actions = [
  "Library",
  "Cafeteria",
  "Elevators",
  "Information Desk"
];

const QuickActions = () => (
  <div>
    <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
    <div className="grid grid-cols-2 gap-2">
      {actions.map(action => (
        <button
          key={action}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
        >
          {action}
        </button>
      ))}
    </div>
  </div>
);

export default QuickActions;
