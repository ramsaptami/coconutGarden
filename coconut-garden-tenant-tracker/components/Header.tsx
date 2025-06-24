
import React from 'react';
import { UserCircleIcon } from './icons'; // PlusIcon removed

interface HeaderProps {
  // onAddTenantClick prop is removed
}

const Header: React.FC<HeaderProps> = () => { // onAddTenantClick removed from props
  return (
    <header className="bg-primary-500 text-white p-6 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <UserCircleIcon className="w-10 h-10" />
          <h1 className="text-3xl font-bold tracking-tight">Coconut Garden Tenant Tracker</h1>
        </div>
        {/* "Add New Tenant" button is removed */}
      </div>
    </header>
  );
};

export default Header;