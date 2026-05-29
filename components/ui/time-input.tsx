import * as React from "react";
import { Input, type InputProps } from "@/components/ui/input";

function normalizeTimeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export const TimeInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ onInput, placeholder = "HH:mm", ...props }, ref) => {
    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={5}
        pattern="(?:[01]\d|2[0-3]):[0-5]\d"
        placeholder={placeholder}
        title="Use 24-hour time as HH:mm"
        onInput={(event) => {
          event.currentTarget.value = normalizeTimeInput(event.currentTarget.value);
          onInput?.(event);
        }}
      />
    );
  }
);
TimeInput.displayName = "TimeInput";
