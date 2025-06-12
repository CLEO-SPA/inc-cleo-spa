import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function DateTimeSelector({ value, onChange }) {
  return (
    <div className="flex flex-col gap-3 w-72">

      <Input
        type="datetime-local"
        id="datetime"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step="1"
      />
    </div>
  );
}
