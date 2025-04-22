import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { LuChevronDown, LuBadgeCheck } from 'react-icons/lu';

const ServiceConsumptionAccordion = ({ services, selectedServices, onServiceSelect }) => {
  // Group services first by name, then by price
  const groupedServices = useMemo(() => {
    const groups = {};
    services.forEach(service => {
      const name = service.cs_service?.service_name;
      const price = service.member_care_package_details_price;
      
      if (!groups[name]) {
        groups[name] = {};
      }
      if (!groups[name][price]) {
        groups[name][price] = [];
      }
      groups[name][price].push(service);
    });
    return groups;
  }, [services]);

  return (
    <div className="space-y-4">
      {Object.entries(groupedServices).map(([serviceName, priceGroups]) => (
        <div key={serviceName} className="border rounded-lg bg-white overflow-hidden">
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{serviceName}</h3>
                <p className="text-sm text-gray-500">
                  {Object.keys(priceGroups).length} price option{Object.keys(priceGroups).length > 1 ? 's' : ''}
                </p>
              </div>
              <LuChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
            </summary>
            
            <div className="border-t border-gray-200">
              {Object.entries(priceGroups).map(([price, priceServices]) => {
                const service = priceServices[0]; // Get first service in price group
                const isSelected = selectedServices.includes(service.member_care_package_details_id);

                // ✅ Fix: Calculate total sessions by counting services at this price
                const totalSessions = priceServices.length; // Total number of services at this price
                const usedSessions = selectedServices.filter(
                  (id) => priceServices.some(service => service.member_care_package_details_id === id)
                ).length;
                const remainingSessions = totalSessions - usedSessions;

                return (
                  <div 
                    key={price}
                    className={`p-4 border-l-4 transition-all ${
                      remainingSessions === 0 ? 'opacity-50' : ''
                    } ${
                      isSelected
                        ? 'border-l-blue-500 bg-blue-50'
                        : 'border-l-transparent hover:border-l-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-baseline gap-3">
                            <span className="text-gray-900 font-medium">
                              ${price}/session
                            </span>
                            <span className={`text-sm ${
                              remainingSessions <= 0 
                                ? 'text-red-500' 
                                : 'text-green-600'
                            }`}>
                              {remainingSessions} sessions remaining
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {service.cs_service?.service_description}
                          </p>
                        </div>
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => onServiceSelect(service.member_care_package_details_id)}
                          disabled={remainingSessions === 0}
                          className={`w-28 h-10 ${
                            isSelected
                              ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {isSelected ? (
                            <div className="flex items-center gap-2">
                              <LuBadgeCheck className="w-4 h-4" />
                              <span>Selected</span>
                            </div>
                          ) : (
                            'Select'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        </div>
      ))}
    </div>
  );
};

export default ServiceConsumptionAccordion;
