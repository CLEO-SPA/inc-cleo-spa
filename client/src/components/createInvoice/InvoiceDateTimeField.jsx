import { useState, useEffect } from "react";
import { InputGroup } from "../ui/input-group";
import { Field } from "../ui/field";

const InvoiceDateTimeField = () => {
  const [currentDateTime, setCurrentDateTime] = useState("");

  useEffect(() => {
    // Get the current date and time in Singapore's timezone (GMT+8)
    const now = new Date();
    const singaporeTime = new Intl.DateTimeFormat("en-SG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Singapore",
    }).formatToParts(now);

    // Format the datetime for the datetime-local input (YYYY-MM-DDTHH:mm)
    const formattedDateTime = `${singaporeTime
      .find((part) => part.type === "year").value}-${singaporeTime
      .find((part) => part.type === "month").value.padStart(2, "0")}-${singaporeTime
      .find((part) => part.type === "day").value.padStart(2, "0")}T${singaporeTime
      .find((part) => part.type === "hour").value.padStart(2, "0")}:${singaporeTime
      .find((part) => part.type === "minute").value.padStart(2, "0")}`;

    setCurrentDateTime(formattedDateTime);
  }, []);

  return (
    <div className="mb-4">
      <Field label="Invoice Date & Time">
        <InputGroup>
          <input
            type="datetime-local"
            value={currentDateTime}
            onChange={(e) => setCurrentDateTime(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </InputGroup>
      </Field>
    </div>
  );
};

export default InvoiceDateTimeField;
