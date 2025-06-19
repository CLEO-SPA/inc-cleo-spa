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
import useMemberStore from "@/stores/useMemberStore";

// Helper function to convert text to proper case
const toProperCase = (text) => {
  if (!text) return text;
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function MemberSelect({
  name = "member_id",
  label = "Assigned Member *",
  disabled: customDisabled = false,
  customOptions = [],
  value,
  onValueChange,
  placeholder,
}) {
  const formContext = useFormContext();
  const members = useMemberStore((state) => state.members);
  const loading = useMemberStore((state) => state.loading);
  const error = useMemberStore((state) => state.error);
  const fetchDropdownMembers = useMemberStore((state) => state.fetchDropdownMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Combine members with custom options
  const allOptions = [...customOptions, ...members];
  const filteredMembers = allOptions.filter((member) =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.member_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to format member display text
  const formatMemberDisplay = (member) => {
    const memberName = toProperCase(member.name || member.member_name);
    const contact = member.contact || member.phone;
    return contact ? `${memberName} - ${contact}` : memberName;
  };

  useEffect(() => {
    if (members.length === 0 && !loading) {
      fetchDropdownMembers();
    }
  }, [members.length, loading, fetchDropdownMembers]);

  const {
    control,
    formState: { errors },
  } = formContext;

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
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
              <SelectTrigger className={errors[name] ? "border-red-500" : ""}>
                <SelectValue
                  placeholder={
                    loading
                      ? "Loading members..."
                      : error
                      ? "Error loading members"
                      : "Select member"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {formatMemberDisplay(member)}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500">
                      No members found
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
        <p className="text-red-500 text-xs">Failed to load members: {error}</p>
      )}
    </div>
  );
}

export default MemberSelect;