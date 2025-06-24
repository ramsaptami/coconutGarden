
import React from 'react';
import { UserCircleIcon } from './icons'; 

interface HeaderProps {
  // Props are no longer needed here if onAddTenantClick is removed globally
}

const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="bg-primary-500 text-white p-6 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <UserCircleIcon className="w-10 h-10" />
          <h1 className="text-3xl font-bold tracking-tight">Coconut Garden Tenant Tracker</h1>
        </div>
        {/* "Add New Tenant" button is removed as tenants are added via HouseCards */}
      </div>
    </header>
  );
};

export default Header;