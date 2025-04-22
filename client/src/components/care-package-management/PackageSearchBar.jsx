import React from 'react';
import { LuSearch } from 'react-icons/lu';

const PackageSearchBar = ({ onSearch, placeholder = "Search packages..." }) => {
  const handleSearch = (e) => {
    onSearch(e.target.value.toLowerCase());
  };

  return (
    <div className="relative mb-6">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <LuSearch className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 border rounded-lg bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-colors"
        placeholder={placeholder}
        onChange={handleSearch}
      />
    </div>
  );
};

export default PackageSearchBar;