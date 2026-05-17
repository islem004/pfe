import React, { createContext, useContext, useState } from "react";

const SelectContext = createContext();

export function Select({ children, defaultValue, onValueChange }) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  
  return (
    <SelectContext.Provider value={{ value, setValue: (val) => { setValue(val); onValueChange?.(val); setOpen(false); }, open, setOpen }}>
      <div className="relative w-full">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className = "", children }) {
  const { open, setOpen } = useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }) {
  const { value } = useContext(SelectContext);
  return <span>{value || placeholder}</span>;
}

export function SelectContent({ children }) {
  const { open } = useContext(SelectContext);
  if (!open) return null;
  return (
    <div className="absolute top-full left-0 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-md z-50">
      {children}
    </div>
  );
}

export function SelectItem({ value, children }) {
  const { setValue, value: selectedValue } = useContext(SelectContext);
  return (
    <div
      onClick={() => setValue(value)}
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 ${selectedValue === value ? "bg-gray-100" : ""}`}
    >
      {children}
    </div>
  );
}
