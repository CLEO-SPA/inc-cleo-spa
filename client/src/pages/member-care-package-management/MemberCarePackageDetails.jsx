import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LuX, LuUser, LuPackage, LuCalendar, LuClipboard, LuPackageX, LuDollarSign, LuMail, LuPhone } from 'react-icons/lu';

const STATUS_STYLES = {
  Invoice_Paid: 'bg-green-500/10 text-green-500',
  Invoice_Unpaid: 'bg-orange-500/10 text-orange-500',
  Invoice_Partially_Paid: 'bg-blue-500/10 text-blue-500',
  Paid: 'bg-green-500/10 text-green-500',
  Unpaid: 'bg-orange-500/10 text-orange-500',
  Consumed: 'bg-blue-500/10 text-blue-500',
};

const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
      <div
        ref={modalRef}
        className="bg-white rounded-xl w-full max-w-7xl shadow-lg transform transition-all duration-300 ease-in-out border border-gray-200 max-h-[90vh] overflow-y-auto"
      >
        {children}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => (
  <Badge variant="outline" className={`${STATUS_STYLES[status]} px-3 py-1`}>
    {status}
  </Badge>
);

const InfoItem = ({ label, value, icon: Icon, className }) => (
  <div className="flex items-center gap-2 text-gray-700">
    {Icon && <Icon className="w-4 h-4 text-gray-500" />}
    <span className="font-medium text-gray-600">{label}:</span>
    <span className={className}>{value}</span>
  </div>
);

const ServiceCard = ({ service }) => (
  <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-center gap-4">
        {/* Service Info - Using flex-1 to take available space */}
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-gray-900">
              {service.cs_service?.service_name}
            </h4>
            <StatusBadge status={service?.cs_status.status_name} />
          </div>
          {service.cs_service?.service_description && (
            <p className="text-sm text-gray-600 mt-0.5">
              {service.cs_service.service_description}
            </p>
          )}
        </div>

        {/* Metrics - Fixed width for consistent alignment */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="px-4 py-2 bg-gray-50 rounded-lg">
            <span className="text-gray-600 text-sm mr-2">Sessions:</span>
            <span className="font-medium text-gray-900">
              {service.member_care_package_details_quantity}
            </span>
          </div>

          <div className="px-4 py-2 bg-gray-50 rounded-lg">
            <span className="text-gray-600 text-sm mr-2">Discount:</span>
            <span className="font-medium text-green-600">
              {service.member_care_package_details_discount}%
            </span>
          </div>

          <div className="px-4 py-2 bg-gray-50 rounded-lg">
            <span className="text-gray-600 text-sm mr-2">Price/Session:</span>
            <span className="font-medium text-blue-600">
              ${Number(service.member_care_package_details_price).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const MemberCarePackageDetails = ({ isOpen, onClose, selectedPackage }) => {
  if (!selectedPackage) return null;

  const services = selectedPackage?.cs_member_care_package_details || [];
  const hasServices = services.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 space-y-6">
        {/* header */}
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">{selectedPackage.care_package_name}</h2>
            <StatusBadge status={selectedPackage.cs_status?.status_name} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            <LuX className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* member details */}
          <Card className="bg-gray-50 border border-gray-200">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <LuUser className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Member Details</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoItem icon={LuUser} label="Name" className="font-medium text-blue-600" value={selectedPackage.cs_members.member_name} />
              <InfoItem icon={LuPhone} label="Contact" className="font-medium text-blue-600" value={selectedPackage.cs_members.member_contact} />
              <InfoItem icon={LuMail} label="Email" className="font-medium text-blue-600" value={selectedPackage.cs_members.member_email} />
            </CardContent>
          </Card>

          {/* package details */}
          <Card className="bg-gray-50 border border-gray-200">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <LuPackage className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Package Details</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoItem
                icon={LuDollarSign}
                label="Total Amount"
                value={`$${Number(selectedPackage.member_care_package_total_amount).toFixed(2)}`}
                className="font-medium text-blue-600"
              />

              <InfoItem
                icon={LuCalendar}
                label="Created On"
                value={new Date(selectedPackage.member_care_package_created_at).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric'
                })}
                className="font-medium text-blue-600"
              />
              <InfoItem
                icon={LuCalendar}
                label="Updated On"
                value={new Date(selectedPackage.member_care_package_updated_at).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric'
                })}
                className="font-medium text-blue-600"
              />
            </CardContent>
          </Card>
        </div>

        {/* services section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <LuClipboard className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Included Services</h3>
          </div>
          {hasServices ? (
            <div className="space-y-3">
              {Object.values(services.reduce((acc, service) => {
                const serviceName = service.cs_service?.service_name;
                const statusName = service.cs_status?.status_name;
                const key = `${serviceName}-${statusName}`;

                if (!acc[key]) {
                  acc[key] = {
                    ...service,
                    member_care_package_details_quantity: 1
                  };
                } else {
                  acc[key].member_care_package_details_quantity += 1;
                }
                return acc;
              }, {}))
                .sort((a, b) => {
                  // First sort by service name
                  const serviceNameComparison = (a.cs_service?.service_name || '').localeCompare(b.cs_service?.service_name || '');
                  if (serviceNameComparison !== 0) return serviceNameComparison;

                  // Then sort by status (Paid first, then Unpaid)
                  const statusA = a.cs_status?.status_name;
                  const statusB = b.cs_status?.status_name;
                  if (statusA === 'Paid' && statusB === 'Unpaid') return -1;
                  if (statusA === 'Unpaid' && statusB === 'Paid') return 1;
                  return 0;
                })
                .map((service, index) => (
                  <ServiceCard key={index} service={service} />
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-300 rounded-lg bg-gray-50">
              <LuPackageX className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium">No services available</p>
              <p className="text-sm text-gray-500 mt-1">This package currently has no services included</p>
            </div>
          )}
        </div>

        <Separator className="bg-gray-200" />

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-1">
              {/* Created by */}
              <div className="flex items-center gap-1">
                <span>Created by</span>
                <span className="font-semibold text-gray-800">{selectedPackage.cs_employees?.employee_name}-{selectedPackage.cs_employees?.employee_code}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MemberCarePackageDetails;