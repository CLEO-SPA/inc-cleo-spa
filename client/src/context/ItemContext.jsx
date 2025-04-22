import { createContext, useState } from 'react';

export const ItemContext = createContext();

export const ItemContextProvider = ({ children }) => {
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectedLines, setSelectedLines] = useState([]);

    const addItem = (item) => {
        const isPackage = item.care_package_name !== undefined;
        const itemId = isPackage ? `C${item.member_care_package_id}` : (item.id || `S${item.service_id}` || `P${item.product_id}`);

        // Check for duplicates
        const isDuplicate = selectedLines.some(line => line.id === itemId);
        if (isDuplicate) {
            console.log(`Duplicate item detected: ${itemId}`);
            alert(`Item "${item.care_package_name || item.name || item.service_name || item.product_name}" is already added to the invoice.`);
            return;
        }

        // Calculate the initial price based on item type
        let initialPrice = 0;
        if (isPackage) {
            initialPrice = parseFloat(item.member_care_package_total_amount) || 0;
        } else if (item.service_id) {
            initialPrice = parseFloat(item.service_default_price) || 0;
        } else if (item.product_id) {
            initialPrice = parseFloat(item.product_default_price) || 0;
        } else {
            initialPrice = parseFloat(item.price) || 0;
        }

        const lineItem = {
            id: itemId,
            name: item.care_package_name || item.name || item.service_name || item.product_name,
            category: item.category || (isPackage ? 'Care Package' : (item.service_id ? 'Services' : 'Products')),
            originalPrice: initialPrice,
            customPrice: 0,
            quantity: 1,
            discount: 0,
            itemRemark: '',
            employeeRemark: '',
            assignedEmployee: '',
            assignedEmployeeId: null,
            assignedEmployeeCmP: 0,
            finalUnitPrice: initialPrice,
            lineTotal: initialPrice,
            isDuplicated: false,
            packageDetails: isPackage ? item.packageDetails : null,
            member_care_package_id: isPackage ? item.member_care_package_id : null
        };

        console.log('Adding new line item:', {
            id: itemId,
            name: lineItem.name,
            category: lineItem.category,
            price: lineItem.originalPrice,
            isPackage,
            packageDetails: lineItem.packageDetails
        });

        setSelectedLines(prev => [...prev, lineItem]);
    };

    const updateLine = (index, updates) => {
        console.log(`Updating line at index ${index}:`, updates);
        setSelectedLines(prevLines => {
            const newLines = [...prevLines];
            const line = { ...newLines[index] };
            const isPackage = line.id?.toString().startsWith('C');

            // Apply updates
            Object.assign(line, updates);

            // Recalculate finalUnitPrice and lineTotal
            if (isPackage) {
                line.finalUnitPrice = line.originalPrice;
                line.lineTotal = line.originalPrice;
            } else {
                if (updates.hasOwnProperty('customPrice') && updates.customPrice > 0) {
                    line.finalUnitPrice = updates.customPrice;
                    line.discount = 0;
                } else if (updates.hasOwnProperty('discount')) {
                    line.customPrice = 0;
                    line.finalUnitPrice = line.originalPrice * (1 - (updates.discount * 10) / 100);
                }

                // Calculate lineTotal based on quantity and finalUnitPrice
                line.lineTotal = line.finalUnitPrice * (line.quantity || 1);
            }

            newLines[index] = line;
            return newLines;
        });
    };

    const duplicateLine = (index) => {
        console.log(`Duplicating line at index ${index}`);
        setSelectedLines(prev => {
            const lineToDuplicate = { ...prev[index] };
            const duplicatedLine = {
                ...lineToDuplicate,
                isDuplicated: true,
                assignedEmployee: '',
                assignedEmployeeId: null,
                assignedEmployeeCmP: 0,
                employeeRemark: ''
            };
            return [...prev, duplicatedLine];
        });
    };

    const removeItem = (itemId) => {
        console.log(`Removing item with ID: ${itemId}`);
        // Handle both normal IDs and package IDs (with 'C' prefix)
        const actualId = itemId.startsWith('C') ? itemId.slice(1) : itemId;
        setSelectedItems(prev => prev.filter(id => id !== actualId));
        setSelectedLines(prev => prev.filter(line => {
            const lineId = line.id.startsWith('C') ? line.id.slice(1) : line.id;
            return lineId !== actualId;
        }));
    };

    return (
        <ItemContext.Provider value={{
            selectedItems,
            setSelectedItems,
            selectedLines,
            setSelectedLines,
            addItem,
            updateLine,
            duplicateLine,
            removeItem
        }}>
            {children}
        </ItemContext.Provider>
    );
};

export default ItemContext;
