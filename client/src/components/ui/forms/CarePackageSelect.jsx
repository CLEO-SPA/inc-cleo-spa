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
import useCpSelectionStore from "@/stores/CarePackage/useCpSelectionStore";
import { cn } from "@/lib/utils";

export function CarePackageSelect({
  name = "id",
  label = "Care Package *",
  disabled: customDisabled = false,
  onSelectFullDetails,
  className = "",
  value,
  onChange,
  error,
}) {
  // try to get form context, but don't fail if it doesn't exist
  const formContext = useFormContext();
  const control = formContext?.control;
  const errors = formContext?.formState?.errors || {};

  // store selectors
  const carePackages = useCpSelectionStore((state) => state.carePackages);
  const loading = useCpSelectionStore((state) => state.loading);
  const storeError = useCpSelectionStore((state) => state.error);
  const detailsError = useCpSelectionStore((state) => state.detailsError);
  const fetchDropdownCarePackages = useCpSelectionStore((state) => state.fetchDropdownCarePackages);
  const fetchCarePackageDetails = useCpSelectionStore((state) => state.fetchCarePackageDetails);
  const getCarePackageDetails = useCpSelectionStore((state) => state.getCarePackageDetails);
  const isCarePackageDetailsLoading = useCpSelectionStore((state) => state.isCarePackageDetailsLoading);

  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPackageLoading, setSelectedPackageLoading] = useState(false);

  const filteredPackages = carePackages.filter((pkg) =>
    (pkg.care_package_name || pkg.package_name || pkg.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (carePackages.length === 0 && !loading) {
      fetchDropdownCarePackages();
    }
  }, [carePackages.length, loading, fetchDropdownCarePackages]);

  const handlePackageSelect = async (packageIdString) => {
    const packageId = packageIdString ? Number(packageIdString) : null;
    if (!packageId || isNaN(packageId)) {
      console.error("Invalid package ID:", packageIdString);
      return;
    }

    try {
      setSelectedPackageLoading(true);
      
      // find the basic package info from the dropdown list
      const basicPackageInfo = carePackages.find(pkg => pkg.id === packageId);
      console.log("Basic package info from dropdown:", basicPackageInfo);
      
      // first try to get cached details
      let packageDetails = getCarePackageDetails(packageId);
      console.log("Cached package details:", packageDetails);

      if (!packageDetails) {
        console.log("No cached details, fetching from API for ID:", packageId);
        packageDetails = await fetchCarePackageDetails(packageId);
        console.log("Fetched package details:", packageDetails);
      }

      // if we have package details, call the callback
      if (onSelectFullDetails) {
        if (packageDetails) {
          console.log("Calling onSelectFullDetails with full details:", packageDetails);
          onSelectFullDetails(packageDetails);
        } else if (basicPackageInfo) {
          console.log("Calling onSelectFullDetails with basic info:", basicPackageInfo);
          onSelectFullDetails(basicPackageInfo);
        }
      }
    } catch (err) {
      console.error("Failed to fetch care package details:", err);
      
      // fallback: if API fails, still pass the basic package info
      const basicPackageInfo = carePackages.find(pkg => pkg.id === packageId);
      if (onSelectFullDetails && basicPackageInfo) {
        console.log("API failed, falling back to basic package info:", basicPackageInfo);
        onSelectFullDetails(basicPackageInfo);
      }
      
      // more specific error message based on the error type
      if (err.response?.status === 500) {
        console.error("Server error - check if package ID exists:", packageId);
      }
    } finally {
      setSelectedPackageLoading(false);
    }
  };

  const isDisabled = loading || storeError || customDisabled || selectedPackageLoading;
  if (control) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
        </Label>

        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <div className="relative">
              <Select
                disabled={isDisabled}
                value={field.value?.toString() || ""}
                onValueChange={(val) => {
                  console.log("Controller onValueChange:", val, typeof val);
                  const packageId = Number(val);
                  field.onChange(packageId);
                  setIsOpen(false);
                  setSearchTerm("");
                  handlePackageSelect(val); 
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
                        ? "Loading packages..."
                        : selectedPackageLoading
                          ? "Loading package details..."
                          : storeError
                            ? "Error loading packages"
                            : "Select care package"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search packages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-8"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto">
                    {filteredPackages.length > 0 ? (
                      filteredPackages.map((pkg) => {
                        console.log("Rendering package:", pkg);
                        return (
                          <SelectItem key={pkg.id} value={pkg.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex flex-col">
                                <span>{pkg.care_package_name || pkg.package_name || pkg.name}</span>
                                {pkg.care_package_price && (
                                  <span className="text-xs text-green-600">
                                    ${parseFloat(pkg.care_package_price).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              {isCarePackageDetailsLoading(pkg.id) && (
                                <span className="text-xs text-gray-500 ml-2">Loading...</span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })
                    ) : searchTerm ? (
                      <div className="p-2 text-sm text-gray-500">
                        No packages found matching "{searchTerm}"
                      </div>
                    ) : (
                      <div className="p-2 text-sm text-gray-500">
                        No care packages available
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>
          )}
        />

        {errors[name] && (
          <p className="text-red-500 text-xs">{errors[name].message}</p>
        )}
        {storeError && (
          <p className="text-red-500 text-xs">Failed to load packages: {storeError}</p>
        )}
        {detailsError && (
          <p className="text-red-500 text-xs">Failed to load package details: {detailsError}</p>
        )}
      </div>
    );
  }

  // if no form context, use direct props
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </Label>

      <div className="relative">
        <Select
          disabled={isDisabled}
          value={value?.toString() || ""}
          onValueChange={(val) => {
            console.log("Direct onValueChange:", val, typeof val);
            const packageId = Number(val);
            if (onChange) onChange(packageId);
            setIsOpen(false);
            setSearchTerm("");
            handlePackageSelect(val); 
          }}
          open={isOpen}
          onOpenChange={setIsOpen}
        >
          <SelectTrigger
            className={cn(
              "w-full",
              error ? "border-red-500" : ""
            )}
          >
            <SelectValue
              placeholder={
                loading
                  ? "Loading packages..."
                  : selectedPackageLoading
                    ? "Loading package details..."
                    : storeError
                      ? "Error loading packages"
                      : "Select care package"
              }
            />
          </SelectTrigger>

          <SelectContent>
            <div className="p-2 border-b">
              <Input
                placeholder="Search packages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
              />
            </div>

            <div className="max-h-48 overflow-y-auto">
              {filteredPackages.length > 0 ? (
                filteredPackages.map((pkg) => {
                  console.log("Rendering package (direct):", pkg);
                  return (
                    <SelectItem key={pkg.id} value={pkg.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col">
                          <span>{pkg.care_package_name || pkg.package_name || pkg.name}</span>
                          {pkg.care_package_price && (
                            <span className="text-xs text-green-600">
                              ${parseFloat(pkg.care_package_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {isCarePackageDetailsLoading(pkg.id) && (
                          <span className="text-xs text-gray-500 ml-2">Loading...</span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })
              ) : searchTerm ? (
                <div className="p-2 text-sm text-gray-500">
                  No packages found matching "{searchTerm}"
                </div>
              ) : (
                <div className="p-2 text-sm text-gray-500">
                  No care packages available
                </div>
              )}
            </div>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-red-500 text-xs">{error}</p>
      )}
      {storeError && (
        <p className="text-red-500 text-xs">Failed to load packages: {storeError}</p>
      )}
      {detailsError && (
        <p className="text-red-500 text-xs">Failed to load package details: {detailsError}</p>
      )}
    </div>
  );
}

export default CarePackageSelect;