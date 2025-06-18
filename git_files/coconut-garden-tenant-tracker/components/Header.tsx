
import React from 'react';
import { PlusIcon, UserCircleIcon } from './icons';

interface HeaderProps {
  onAddTenantClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddTenantClick }) => {
  const handleAddClick = () => {
    onAddTenantClick();
  };

  return (
    <header className="bg-primary-500 text-white p-6 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <UserCircleIcon className="w-10 h-10" />
          <h1 className="text-3xl font-bold tracking-tight">Coconut Garden Tenant Tracker</h1>
        </div>
        <button
          onClick={handleAddClick}
          className="bg-accent-50 text-primary-600 hover:bg-accent-100 font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add New Tenant</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
