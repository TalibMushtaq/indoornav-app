import React from 'react';
import { useAppContext } from '../App';
import NavigationPanel from './NavigationPanel';
import QuickActions from './QuickActions';

const Navigation = () => {
  const { user } = useAppContext();

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <NavigationPanel />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;