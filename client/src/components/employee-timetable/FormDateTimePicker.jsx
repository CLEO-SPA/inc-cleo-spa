import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import DateTimePicker from './DateTimePicker';

export default function FormDateTimePicker({
  name,
  label,
  optional = false,
  time,
  onTimeChange
}) {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[name]?.message;

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: optional ? false : `${label || name} is required` }}
      render={({ field }) => (
        <DateTimePicker
          label={label}
          date={field.value}
          onDateChange={field.onChange}
          time={time}
          onTimeChange={onTimeChange}
          error={error}
          optional={optional}
        />
      )}
    />
  );
}
