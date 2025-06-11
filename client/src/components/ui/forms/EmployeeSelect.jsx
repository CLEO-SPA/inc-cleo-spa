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
import useEmployeeStore from "@/stores/useEmployeeStore";

import { cn } from "@/lib/utils"; // feature/member

export function EmployeeSelect({
  name = "employee_id",
  label = "Assigned Employee *",
  disabled: customDisabled = false,
  className = "",  // feature/member
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const employees = useEmployeeStore((state) => state.employees);
  const loading = useEmployeeStore((state) => state.loading);
  const error = useEmployeeStore((state) => state.error);
  const fetchDropdownEmployees = useEmployeeStore((state) => state.fetchDropdownEmployees);

  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredEmployees = employees.filter((emp) =>
    emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (employees.length === 0 && !loading) {
      fetchDropdownEmployees();
    }
  }, [employees.length, loading, fetchDropdownEmployees]);

  return (
//     <div className={cn("space-y-2", className)}> feature/member
    <div className="space-y-2">
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
              disabled={loading || error || customDisabled}
              value={field.value?.toString() || ""}
              onValueChange={(val) => {
                field.onChange(Number(val));
                setIsOpen(false);
                setSearchTerm("");
              }}
              open={isOpen}
              onOpenChange={setIsOpen}
            >

//               <SelectTrigger
//                 className={cn(
//                   "w-full", 
//                   errors[name] ? "border-red-500" : ""
//                 )}
//               >
              <SelectTrigger className={errors[name] ? "border-red-500" : ""}>
                <SelectValue
                  placeholder={
                    loading
                      ? "Loading employees..."
                      : error
                      ? "Error loading employees"
                      : "Select employee"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.employee_name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500">
                      No employees found
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
      {error && (
        <p className="text-red-500 text-xs">Failed to load employees: {error}</p>
      )}
    </div>
  );
}

export default EmployeeSelect;
