import React from 'react';
import { Textarea } from "./textarea";
import { Label } from "./label";
import { cn } from "@/lib/utils";

interface DescriptionInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  limit: number;
  label?: string;
  className?: string;
  name?: string;
  id?: string;
}

const DescriptionInput = React.forwardRef<HTMLTextAreaElement, DescriptionInputProps>((
  { value, onChange, limit, label, className, name, id, ...props },
  ref
) => {
  const charsRemaining = limit - value.length;
  const isApproachingLimit = charsRemaining <= limit * 0.2 && charsRemaining > 0;
  const isExceededLimit = charsRemaining < 0;

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={id || name}>{label}</Label>}
      <Textarea
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        className={cn(
          "min-h-[120px] bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400",
        )}
        maxLength={limit} // HTML5 maxLength attribute for basic browser enforcement
        {...props}
        ref={ref}
      />
      <div
        className={cn(
          "text-right text-sm",
          isExceededLimit ? "text-red-400" : isApproachingLimit ? "text-orange-400" : "text-amber-200/60",
        )}
      >
        {value.length}/{limit} characters
      </div>
    </div>
  );
});

DescriptionInput.displayName = "DescriptionInput";

export { DescriptionInput }; 