import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

// To use, place in your arguements in the parameters. I.e. <SearchBox onSearch={handleSearch} /> where handleSearch is a function that takes the search term as an argument.
const SearchBox = ({ 
  placeholder = "Search...", 
  onSearch, 
  className = "",
  size = "md" 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleClear = () => {
    setSearchTerm('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  const sizeClasses = {
    sm: "h-8 text-sm",
    md: "h-10 text-base", 
    lg: "h-12 text-lg"
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          size={iconSizes[size]}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
          placeholder={placeholder}
          className={`
            w-full pl-10 pr-10 py-2 
            ${sizeClasses[size]}
            border border-gray-300 rounded-lg
            bg-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-all duration-200
            placeholder-gray-400
          `}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X size={iconSizes[size]} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBox;