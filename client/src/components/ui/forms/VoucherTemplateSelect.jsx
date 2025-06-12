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
import useVoucherTemplateStore from "@/stores/useVoucherTemplateStore";
import { cn } from "@/lib/utils";

export function VoucherTemplateSelect({
  name = "id",
  label = "Voucher Template *",
  disabled: customDisabled = false,
  onSelectFullDetails,
  className = "",
  value,
  onChange,
  error,
}) {
  // Try to get form context, but don't fail if it doesn't exist
  const formContext = useFormContext();
  const control = formContext?.control;
  const errors = formContext?.formState?.errors || {};

  // Store selectors
  const voucherTemplates = useVoucherTemplateStore((state) => state.voucherTemplates);
  const loading = useVoucherTemplateStore((state) => state.loading);
  const storeError = useVoucherTemplateStore((state) => state.error);
  const detailsError = useVoucherTemplateStore((state) => state.detailsError);
  const fetchDropdownVoucherTemplates = useVoucherTemplateStore((state) => state.fetchDropdownVoucherTemplates);
  const fetchVoucherTemplateDetails = useVoucherTemplateStore((state) => state.fetchVoucherTemplateDetails);
  const getVoucherTemplateDetails = useVoucherTemplateStore((state) => state.getVoucherTemplateDetails);
  const isVoucherTemplateDetailsLoading = useVoucherTemplateStore((state) => state.isVoucherTemplateDetailsLoading);

  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplateLoading, setSelectedTemplateLoading] = useState(false);

  const filteredTemplates = voucherTemplates.filter((tpl) =>
    tpl.voucher_template_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (voucherTemplates.length === 0 && !loading) {
      fetchDropdownVoucherTemplates();
    }
  }, [voucherTemplates.length, loading, fetchDropdownVoucherTemplates]);

  const handleTemplateSelect = async (templateId) => {
    try {
      setSelectedTemplateLoading(true);
      let templateDetails = getVoucherTemplateDetails(templateId);

      if (!templateDetails) {
        templateDetails = await fetchVoucherTemplateDetails(templateId);
      }

      if (onSelectFullDetails && templateDetails) {
        onSelectFullDetails(templateDetails);
      }
    } catch (err) {
      console.error("Failed to fetch voucher template details:", err);
    } finally {
      setSelectedTemplateLoading(false);
    }
  };

  const isDisabled = loading || storeError || customDisabled || selectedTemplateLoading;

  // If we have form context, use Controller
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
                  const templateId = Number(val);
                  field.onChange(templateId);
                  setIsOpen(false);
                  setSearchTerm("");
                  handleTemplateSelect(templateId);
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
                        ? "Loading templates..."
                        : selectedTemplateLoading
                          ? "Loading template details..."
                          : storeError
                            ? "Error loading templates"
                            : "Select voucher template"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-8"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto">
                    {filteredTemplates.length > 0 ? (
                      filteredTemplates.map((tpl) => (
                        <SelectItem key={tpl.id} value={tpl.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{tpl.voucher_template_name}</span>
                            {isVoucherTemplateDetailsLoading(tpl.id) && (
                              <span className="text-xs text-gray-500 ml-2">Loading...</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : searchTerm ? (
                      <div className="p-2 text-sm text-gray-500">
                        No templates found matching "{searchTerm}"
                      </div>
                    ) : (
                      <div className="p-2 text-sm text-gray-500">
                        No voucher templates available
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
          <p className="text-red-500 text-xs">Failed to load templates: {storeError}</p>
        )}
        {detailsError && (
          <p className="text-red-500 text-xs">Failed to load template details: {detailsError}</p>
        )}
      </div>
    );
  }

  // If no form context, use direct props
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
            const templateId = Number(val);
            if (onChange) onChange(templateId);
            setIsOpen(false);
            setSearchTerm("");
            handleTemplateSelect(templateId);
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
                  ? "Loading templates..."
                  : selectedTemplateLoading
                    ? "Loading template details..."
                    : storeError
                      ? "Error loading templates"
                      : "Select voucher template"
              }
            />
          </SelectTrigger>

          <SelectContent>
            <div className="p-2 border-b">
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
              />
            </div>

            <div className="max-h-48 overflow-y-auto">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>{tpl.voucher_template_name}</span>
                      {isVoucherTemplateDetailsLoading(tpl.id) && (
                        <span className="text-xs text-gray-500 ml-2">Loading...</span>
                      )}
                    </div>
                  </SelectItem>
                ))
              ) : searchTerm ? (
                <div className="p-2 text-sm text-gray-500">
                  No templates found matching "{searchTerm}"
                </div>
              ) : (
                <div className="p-2 text-sm text-gray-500">
                  No voucher templates available
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
        <p className="text-red-500 text-xs">Failed to load templates: {storeError}</p>
      )}
      {detailsError && (
        <p className="text-red-500 text-xs">Failed to load template details: {detailsError}</p>
      )}
    </div>
  );
}

export default VoucherTemplateSelect;