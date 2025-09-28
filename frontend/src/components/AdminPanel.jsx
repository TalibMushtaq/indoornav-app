import React from 'react';
import { useAppContext } from '../App';
import NavigationPanel from './NavigationPanel';
import QuickActions from './QuickActions';

const AdminPanel = () => {
  const { user } = useAppContext();

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-700">Please sign in to access the admin panel.</p>
      </div>
    );
  }

  return (
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
  );
};

export default AdminPanel;