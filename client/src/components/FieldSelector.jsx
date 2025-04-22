import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

const FilteredSelect = ({
  options = [],
  value = '',
  onChange,
  getOptionLabel,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  className = "w-1/2"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // safe find operation with null checks
  const selectedOption = value ? options.find(opt => opt?.id?.toString() === value.toString()) : null;

  const filteredOptions = options.filter(option =>
    option && getOptionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionId) => {
    if (onChange) {
      onChange(optionId);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className="flex items-center w-full bg-white text-gray-900 rounded-md p-2 border border-gray-200 cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
        <div className="flex-grow min-w-0">
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-400"
              placeholder={searchPlaceholder}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
              {selectedOption ? getOptionLabel(selectedOption) : placeholder}
            </span>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-900 truncate"
                onClick={() => handleSelect(option.id.toString())}
              >
                {getOptionLabel(option)}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-400">No options found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilteredSelect;