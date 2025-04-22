import { Link } from 'react-router-dom';
import React, { useCallback, useState } from 'react';
import { LuPackage, LuUsers, LuMenu, LuX, LuDollarSign, LuUser, LuFileText, LuStore } from 'react-icons/lu';
import Logout from '@/components/auth/Logout';

const menuItems = [
  {
    title: 'Users',
    icon: <LuUsers className="h-5 w-5" />,
    submenu: [
      { name: 'Members', heading: true },
      { name: 'Create Member', path: '/cm' },
      { name: 'Record Membership', path: '/ma/mr' },
      { name: 'Daily Membership', path: '/da/ma' },
      { name: 'Manage Membership Types', path: '/membershiptype' },
      { name: 'Customer Followups', path: '/customer/followups' },
      { name: 'Employees', heading: true },
      { name: 'Create Department', path: '/createDepartment' },
      { name: 'Manage Departments', path: '/departments' },
      { name: 'Create Employee', path: '/createEmployee' },
      { name: 'Manage Employees', path: '/employees' },
      { name: 'Manage Positions', path: '/positions' },
    ],
  },
  {
    title: 'Care Packages',
    icon: <LuPackage className="h-5 w-5" />,
    submenu: [
      { name: 'Create Package', path: '/cpf' },
      { name: 'Manage Packages', path: '/cpd' },
      { name: 'Create Member Care Package', path: '/mcpf' },
      { name: 'Manage Member Care Packages', path: '/mcpd' },
      { name: 'Package Reports', path: '/packages/reports' },
      { name: 'Package Transactions', path: '/transactions' },
    ],
  },
  {
    title: 'Products & Services',
    icon: <LuStore className="h-5 w-5" />,
    submenu: [
      { name: 'Services', heading: true },
      { name: 'Create Service', path: '/sc' },
      { name: 'Manage Service', path: '/sm' },
      { name: 'Products', heading: true },
      { name: 'Create Product', path: '/pdc' },
      { name: 'Manage Product', path: '/pdm' },
    ],
  },
  {
    title: 'Finance',
    icon: <LuDollarSign className="h-5 w-5" />,
    submenu: [
      { name: 'Transactions', path: '/finance/payments' },
      { name: 'Revenue Reports', path: '/finance/revenue' },
      { name: 'Service Reports', path: '/service/revenue' },
      { name: 'Product Reports', path: '/product/revenue' },
      { name: 'Deferred Revenue', path: '/finance/deferred' },
      { name: 'Process Refund', path: '/finance/refund' },
      { name: 'Credit Notes', path: '/finance/creditNote' },
      { name: 'Payment Method Management', path: '/pmm' },
    ],
  },
  {
    title: 'Invoice',
    icon: <LuFileText className="h-5 w-5" />,
    submenu: [
      { name: 'Create Invoice', path: '/ci' },
      { name: 'View Invoices', path: '/invoices' },
    ],
  },
  {
    title: 'Miscellaneous',
    icon: <LuUser className="h-5 w-5" />,
    submenu: [
      { name: 'Export Data', path: '/misc/ed' },
      { name: 'Export Data Continuation', path: '/misc/edc' },
      { name: 'Add Translations', path: '/tl' },
    ],
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [hoverTimer, setHoverTimer] = useState(null);

  const handleMouseEnter = useCallback(
    (menuTitle) => {
      if (hoverTimer) clearTimeout(hoverTimer);
      setHoveredMenu(menuTitle);
    },
    [hoverTimer]
  );

  const handleMouseLeave = useCallback(() => {
    const timer = setTimeout(() => {
      setHoveredMenu(null);
    }, 300); // 300ms delay before closing
    setHoverTimer(timer);
  }, []);

  const renderSubmenuItem = (subItem) => {
    if (subItem.heading) {
      return (
        <div key={subItem.name} className="px-4 py-1 text-sm font-semibold text-gray-500 bg-gray-50">
          {subItem.name}
        </div>
      );
    }
    return (
      <Link
        key={subItem.name}
        to={subItem.path}
        className="block px-4 py-2 hover:bg-gray-100"
        onClick={() => {
          setActiveMenu(null);
          setIsOpen(false);
        }}
      >
        {subItem.name}
      </Link>
    );
  };

  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold">
          Cleo Spa
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6">
          {menuItems.map((item) => (
            <div
              key={item.title}
              className="relative group"
              onMouseEnter={() => handleMouseEnter(item.title)}
              onMouseLeave={handleMouseLeave}
            >
              <button className="flex items-center space-x-2 hover:text-gray-300">
                {item.icon}
                <span>{item.title}</span>
              </button>
              {/* Dropdown */}
              {(hoveredMenu === item.title || activeMenu === item.title) && (
                <div className="absolute left-0 mt-2 w-48 bg-white text-gray-800 shadow-md rounded-md z-50">
                  {item.submenu.map(renderSubmenuItem)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center space-x-4">
          {/* <Link to="/tl" className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600">
            Add Translations
          </Link> */}
          <Logout />
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <LuX size={24} /> : <LuMenu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-gray-900 text-white p-4 space-y-2">
          {menuItems.map((item) => (
            <div key={item.title}>
              <button
                className="flex items-center space-x-2 w-full text-left"
                onClick={() => setActiveMenu(activeMenu === item.title ? null : item.title)}
              >
                {item.icon}
                <span>{item.title}</span>
              </button>
              {activeMenu === item.title && <div className="pl-4 space-y-1">{item.submenu.map(renderSubmenuItem)}</div>}
            </div>
          ))}
          <Logout />
        </div>
      )}
    </nav>
  );
}
