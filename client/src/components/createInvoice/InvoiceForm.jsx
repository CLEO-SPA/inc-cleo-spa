import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../interceptors/axios';
import { Home } from 'lucide-react';
import InvoiceDateTimeField from './InvoiceDateTimeField';
import { ItemContext } from '../../context/ItemContext';
import ItemSelectionModal from './ItemSelectionModal';
import EmployeeModal from './EmployeeModal';

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { selectedItems, selectedLines, updateLine, duplicateLine, removeItem, setSelectedItems } =
    useContext(ItemContext);

  const [members, setMembers] = useState([]);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberSearchInput, setMemberSearchInput] = useState('');
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [membersRes] = await Promise.all([api.get('/ci/getAllMembers')]);

        const membersData = membersRes.data.data.map((member) => ({
          id: member.member_id.toString(),
          name: member.member_name,
          email: member.member_email,
        }));

        setMembers(membersData);
        setFilteredMembers(membersData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, []);

  // Update the handleMemberSearch function to filter by email
  const handleMemberSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setMemberSearchInput(value);
    setMemberEmail(value); // Update email when searching

    const filtered = members.filter(
      (member) => member.name.toLowerCase().includes(value) || member.email.toLowerCase().includes(value)
    );
    setFilteredMembers(filtered);

    if (!filtered.some((member) => member.id === selectedMember)) {
      setSelectedMember('');
    }
  };

  // Update email change handler to also filter members
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setMemberEmail(value);

    const filtered = members.filter((member) => member.email.toLowerCase().includes(value.toLowerCase()));
    setFilteredMembers(filtered);
  };

  const handleMemberSelection = (e) => {
    const memberId = e.target.value;
    setSelectedMember(memberId);

    if (memberId) {
      const selectedMemberData = members.find((member) => member.id === memberId);
      setMemberEmail(selectedMemberData.email);
    } else {
      setMemberEmail('');
    }
  };

  const handleOpenEmployeeModal = (index) => {
    setCurrentLineIndex(index);
    setIsEmployeeModalOpen(true);
  };

  const handleEmployeeSelect = (employee) => {
    if (currentLineIndex !== null) {
      updateLine(currentLineIndex, {
        assignedEmployee: employee.employee_code,
        assignedEmployeeCmP: employee.commission_percentage,
        assignedEmployeeId: employee.employee_id,
        employeeMatches: [],
      });
    }
    setIsEmployeeModalOpen(false);
  };

  // Update handleFieldChange for the new discount logic
  const handleFieldChange = (index, field, value) => {
    const updates = { [field]: value };
    const line = selectedLines[index];
    const isPackage = line.id?.toString().startsWith('C');

    if (isPackage) {
      // For packages, maintain original price
      updates.finalUnitPrice = line.originalPrice;
      updates.customPrice = 0;
      updates.discount = 0;
      const quantity = field === 'quantity' ? value : line.quantity;
      updates.lineTotal = updates.finalUnitPrice * quantity;
    } else {
      // For non-package items
      if (field === 'discount') {
        updates.customPrice = 0;
        const discountPercentage = value * 10;
        updates.finalUnitPrice = line.originalPrice * (1 - discountPercentage / 100);
      } else if (field === 'customPrice') {
        updates.discount = 0;
        updates.finalUnitPrice = value || line.originalPrice;
      }

      // Calculate line total
      const quantity = field === 'quantity' ? value : line.quantity || 1;
      updates.lineTotal = updates.finalUnitPrice * quantity;
    }

    updateLine(index, updates);
  };

  const totalPayable = selectedLines.reduce((total, line) => total + line.lineTotal, 0);

  const handleProceedToPayment = () => {
    // Check if member is selected
    if (!selectedMember) {
      alert('Please select a member before proceeding to payment.');
      return;
    }

    // Check for unassigned items
    const unassignedItems = selectedLines.filter((item) => !item.assignedEmployeeId);
    if (unassignedItems.length > 0) {
      alert('Please assign employees to all items before proceeding.');
      return;
    }

    const memberInfo = members.find((m) => m.id === selectedMember);

    // Add logging for data being sent to InvoiceSummary
    console.log('Sending data to Invoice Summary:', {
      selectedLines: selectedLines.map((line) => ({
        id: line.id,
        name: line.name,
        category: line.category,
        assignedEmployee: line.assignedEmployee,
        originalPrice: line.originalPrice,
        finalUnitPrice: line.finalUnitPrice,
        lineTotal: line.lineTotal,
        packageDetails: line.packageDetails,
      })),
      memberInfo: {
        id: memberInfo?.id,
        name: memberInfo?.name,
        email: memberInfo?.email,
      },
      totalPayable: totalPayable,
    });

    navigate('/cip', {
      state: {
        selectedLines,
        selectedMember: memberInfo,
      },
    });
  };

  const groupedLines = {
    Services: selectedLines.filter((line) => line.id?.toString().startsWith('S')),
    Products: selectedLines.filter((line) => line.id?.toString().startsWith('P')),
    Packages: selectedLines.filter((line) => line.id?.toString().startsWith('C')),
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage new invoice records</p>
        </div>
      </div>

      <InvoiceDateTimeField />

      {/* Member Selection Section */}
      <div className="flex items-center gap-4 mb-4">
        <label htmlFor="memberEmail" className="block font-bold">
          Member Email:
        </label>
        <input
          id="memberEmail"
          type="email"
          value={memberEmail}
          onChange={handleEmailChange}
          placeholder="Enter member email"
          className="flex-1 p-2 border border-gray-300 rounded"
        />

        <label htmlFor="memberSearchInput" className="block font-bold">
          Member Search:
        </label>
        <input
          id="memberSearchInput"
          type="text"
          value={memberSearchInput}
          onChange={handleMemberSearch}
          placeholder="Search by name"
          className="flex-1 p-2 border border-gray-300 rounded"
        />

        <select
          className="flex-1 p-2 border border-gray-300 rounded"
          onChange={handleMemberSelection}
          value={selectedMember}
        >
          <option value="">Select Member</option>
          {filteredMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} ({member.email})
            </option>
          ))}
        </select>
      </div>

      {selectedMember && (
        <div className="text-gray-700 font-semibold mb-4">
          Selected Member: {members.find((m) => m.id === selectedMember)?.name || 'N/A'}
        </div>
      )}

      {/* Add Items Button */}
      <div className="mb-4">
        <button
          onClick={() => setIsItemModalOpen(true)}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          disabled={!selectedMember}
        >
          {!selectedMember ? 'Select a Member First' : 'Add Items'}
        </button>
      </div>

      {/* Item Selection Modal */}
      <ItemSelectionModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setSelectedItems([]); // Clear selected items when modal is closed
        }}
        memberEmail={memberEmail}
        selectedMember={selectedMember}
        selectedLines={selectedLines} // Add this prop
      />

      {/* Selected Items Table */}
      {selectedLines.length > 0 && (
        <div className="mb-4">
          <h2 className="font-bold mb-2 text-lg">Selected Items</h2>
          <div className="overflow-x-auto">
            <table className="table-auto w-full border-collapse border border-gray-300">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Assigned Employee</th>
                  <th className="px-4 py-3 text-left">Employee Remark</th>
                  <th className="px-4 py-3 text-left">Original Price</th>
                  <th className="px-4 py-3 text-left">Custom Price</th>
                  <th className="px-4 py-3 text-left">Quantity</th>
                  <th className="px-4 py-3 text-left">Discount (%)</th>
                  <th className="px-4 py-3 text-left">Item Remark</th>
                  <th className="px-4 py-3 text-left">Final Unit Price</th>
                  <th className="px-4 py-3 text-left">Line Total</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedLines).map(
                  ([type, lines]) =>
                    lines.length > 0 && (
                      <React.Fragment key={type}>
                        <tr className="bg-blue-50">
                          <td colSpan="12" className="px-4 py-3 font-bold text-left">
                            {type}
                          </td>
                        </tr>
                        {lines.map((line, lineIndex) => {
                          const globalIndex = selectedLines.findIndex((l) => l === line);
                          return (
                            <tr key={`${type}-${lineIndex}`} className="border-b border-gray-200 hover:bg-gray-100">
                              <td className="px-4 py-3">
                                {line.name}
                                {line.packageDetails && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {line.packageDetails.map((detail, idx) => (
                                      <div key={idx}>{detail.service_name}</div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3">{line.category}</td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={line.assignedEmployee || ''}
                                  placeholder="Click to select"
                                  className="w-full border border-gray-300 rounded px-2 py-1 cursor-pointer hover:bg-gray-50"
                                  readOnly
                                  onClick={() => handleOpenEmployeeModal(globalIndex)}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <textarea
                                  value={line.employeeRemark || ''}
                                  onChange={(e) => handleFieldChange(globalIndex, 'employeeRemark', e.target.value)}
                                  placeholder="Enter Remark"
                                  className="h-20 border border-gray-300 rounded px-2 py-1 resize-none"
                                />
                              </td>
                              <td className="px-4 py-3">${line.originalPrice.toFixed(2)}</td>
                              <td className="px-4 py-3">
                                {/* Custom Price Input */}
                                {type !== 'Packages' ? (
                                  <input
                                    type="number"
                                    min="0"
                                    value={line.customPrice || ''}
                                    onChange={(e) => {
                                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                      handleFieldChange(globalIndex, 'customPrice', value);
                                    }}
                                    className="w-full border border-gray-300 rounded px-2 py-1"
                                  />
                                ) : (
                                  <span>-</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {/* Quantity Input */}
                                {type !== 'Packages' ? (
                                  <input
                                    type="number"
                                    min="1"
                                    value={line.quantity || 1}
                                    onChange={(e) => {
                                      const value = e.target.value === '' ? 1 : Math.max(1, parseInt(e.target.value));
                                      handleFieldChange(globalIndex, 'quantity', value);
                                    }}
                                    className="w-full border border-gray-300 rounded px-2 py-1"
                                  />
                                ) : (
                                  <span>1</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {/* Discount Input */}
                                {type !== 'Packages' ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="1"
                                    value={line.discount || 0}
                                    onChange={(e) => {
                                      const value =
                                        e.target.value === ''
                                          ? 0
                                          : Math.min(Math.max(parseFloat(e.target.value), 0), 10);
                                      handleFieldChange(globalIndex, 'discount', value);
                                    }}
                                    className="w-full border border-gray-300 rounded px-2 py-1"
                                    placeholder="0-10"
                                  />
                                ) : (
                                  <span>-</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <textarea
                                  value={line.itemRemark || ''}
                                  onChange={(e) => handleFieldChange(globalIndex, 'itemRemark', e.target.value)}
                                  placeholder="Enter Remark"
                                  className="h-20 border border-gray-300 rounded px-2 py-1 resize-none"
                                />
                              </td>
                              <td className="px-4 py-3">${line.finalUnitPrice.toFixed(2)}</td>
                              <td className="px-4 py-3">${line.lineTotal.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm">
                                {!line.isDuplicated && type !== 'Packages' && (
                                  <button
                                    onClick={() => duplicateLine(globalIndex)}
                                    className="text-blue-500 hover:underline mr-2"
                                  >
                                    Duplicate
                                  </button>
                                )}
                                <button onClick={() => removeItem(line.id)} className="text-red-500 hover:underline">
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Total and Action Button */}
      <div className="text-right font-bold text-lg mt-4">Total Payable Amount: ${totalPayable.toFixed(2)}</div>

      <button
        onClick={handleProceedToPayment}
        className="w-full mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={selectedLines.length === 0 || !selectedMember}
      >
        {!selectedMember
          ? 'Select a Member to Proceed'
          : selectedLines.length === 0
          ? 'Add Items to Proceed'
          : 'Proceed to Select Payment Method'}
      </button>

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSelectEmployee={handleEmployeeSelect}
        selectedEmployee={currentLineIndex !== null ? selectedLines[currentLineIndex] : null}
      />
    </div>
  );
};

export default InvoiceForm;
