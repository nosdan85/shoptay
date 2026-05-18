"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import { cn, MAX_UI_QUANTITY } from "@/lib/utils";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  step?: number;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = MAX_UI_QUANTITY,
  disabled = false,
  className,
  size = "md",
  showLabel = true,
  step = 1,
}: QuantitySelectorProps) {
  const [inputValue, setInputValue] = useState(String(value));

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);

    const num = parseInt(raw, 10);
    if (isNaN(num)) {
      return;
    }

    const clamped = Math.min(Math.max(num, min), max);
    if (clamped !== num) {
      onChange(clamped);
    }
  };

  const handleBlur = () => {
    const num = parseInt(inputValue, 10);
    if (isNaN(num) || num < min) {
      setInputValue(String(min));
      onChange(min);
    } else if (num > max) {
      setInputValue(String(max));
      onChange(max);
    }
  };

  const increment = useCallback(() => {
    const newValue = Math.min(value + step, max);
    onChange(newValue);
  }, [value, max, step, onChange]);

  const decrement = useCallback(() => {
    const newValue = Math.max(value - step, min);
    onChange(newValue);
  }, [value, min, step, onChange]);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  const inputSizeClasses = {
    sm: "h-8 w-14 text-xs",
    md: "h-10 w-16 text-sm",
    lg: "h-12 w-20 text-base",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="icon"
        className={cn(sizeClasses[size], "shrink-0")}
        onClick={decrement}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3 w-3" />
      </Button>

      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={cn(
          "text-center [-moz-appearance:_textfield] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          inputSizeClasses[size]
        )}
      />

      <Button
        variant="outline"
        size="icon"
        className={cn(sizeClasses[size], "shrink-0")}
        onClick={increment}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-3 w-3" />
      </Button>

      {showLabel && size !== "sm" && (
        <span className="ml-2 text-sm text-muted-foreground">
          {value} {value === 1 ? "unit" : "units"}
        </span>
      )}
    </div>
  );
}
