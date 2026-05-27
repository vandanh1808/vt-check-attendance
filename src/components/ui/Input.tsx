"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900
            shadow-sm transition-all duration-150
            placeholder:text-slate-400
            hover:border-slate-400
            focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
            disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500
            ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
