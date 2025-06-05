import { Controller, useFormContext } from "react-hook-form";
import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import useServiceStore from "@/stores/useServiceStore";
import { cn } from "@/lib/utils"; 

export function ServiceSelect({
  name = "service_id",
  label = "Service *",
  disabled: customDisabled = false,
  onSelectFullDetails,
  className = "", 
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  // Store selectors
  const services = useServiceStore((state) => state.services);
  const loading = useServiceStore((state) => state.loading);
  const error = useServiceStore((state) => state.error);
  const detailsError = useServiceStore((state) => state.detailsError);
  const fetchDropdownServices = useServiceStore((state) => state.fetchDropdownServices);
  const fetchServiceDetails = useServiceStore((state) => state.fetchServiceDetails);
  const getServiceDetails = useServiceStore((state) => state.getServiceDetails);
  const isServiceDetailsLoading = useServiceStore((state) => state.isServiceDetailsLoading);

  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedServiceLoading, setSelectedServiceLoading] = useState(false);

  // Filter services based on search term
  const filteredServices = services.filter((svc) =>
    svc.service_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch dropdown services on mount
  useEffect(() => {
    if (services.length === 0 && !loading) {
      fetchDropdownServices();
    }
  }, [services.length, loading, fetchDropdownServices]);

  // Handle service selection
  const handleServiceSelect = async (serviceId) => {
    try {
      setSelectedServiceLoading(true);

      // Check if we already have cached details
      let serviceDetails = getServiceDetails(serviceId);

      if (!serviceDetails) {
        // Fetch full service details
        serviceDetails = await fetchServiceDetails(serviceId);
      }

      // Call the callback with full service details
      if (onSelectFullDetails && serviceDetails) {
        onSelectFullDetails(serviceDetails);
      }
    } catch (err) {
      console.error("Failed to fetch service details:", err);
    } finally {
      setSelectedServiceLoading(false);
    }
  };

  const isDisabled = loading || error || customDisabled || selectedServiceLoading;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </Label>

      <Controller
        name={name}
        control={control}
        rules={{ required: `${label} is required` }}
        render={({ field }) => (
          <div className="relative">
            <Select
              disabled={isDisabled}
              value={field.value?.toString() || ""}
              onValueChange={(val) => {
                const serviceId = Number(val);
                field.onChange(serviceId);
                setIsOpen(false);
                setSearchTerm("");
                handleServiceSelect(serviceId);
              }}
              open={isOpen}
              onOpenChange={setIsOpen}
            >
              <SelectTrigger
                className={cn(
                  "w-full",
                  errors[name] ? "border-red-500" : ""
                )}
              >
                <SelectValue
                  placeholder={
                    loading
                      ? "Loading services..."
                      : selectedServiceLoading
                        ? "Loading service details..."
                        : error
                          ? "Error loading services"
                          : "Select service"
                  }
                />
              </SelectTrigger>

              <SelectContent>
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto">
                  {filteredServices.length > 0 ? (
                    filteredServices.map((svc) => (
                      <SelectItem key={svc.id} value={svc.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{svc.service_name}</span>
                          {isServiceDetailsLoading(svc.id) && (
                            <span className="text-xs text-gray-500 ml-2">Loading...</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : searchTerm ? (
                    <div className="p-2 text-sm text-gray-500">
                      No services found matching "{searchTerm}"
                    </div>
                  ) : (
                    <div className="p-2 text-sm text-gray-500">
                      No services available
                    </div>
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>
        )}
      />

      {/* Error messages */}
      {errors[name] && (
        <p className="text-red-500 text-xs">{errors[name].message}</p>
      )}
      {error && (
        <p className="text-red-500 text-xs">Failed to load services: {error}</p>
      )}
      {detailsError && (
        <p className="text-red-500 text-xs">Failed to load service details: {detailsError}</p>
      )}
    </div>
  );
}

export default ServiceSelect;