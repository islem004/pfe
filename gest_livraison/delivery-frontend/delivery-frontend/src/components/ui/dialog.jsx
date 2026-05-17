import React, { useState } from "react";

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)}></div>
      <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-lg">
        {children}
      </div>
    </div>
  );
}

export function DialogTrigger({ children, asChild, onClick }) {
  if (asChild) {
    return React.cloneElement(children, {
      onClick: (e) => {
        if (children.props.onClick) children.props.onClick(e);
        if (onClick) onClick(e);
      }
    });
  }
  return <button onClick={onClick}>{children}</button>;
}

export function DialogContent({ className = "", children }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function DialogHeader({ className = "", children }) {
  return <div className={`flex flex-col space-y-1.5 text-center sm:text-left mb-4 ${className}`}>{children}</div>;
}

export function DialogTitle({ className = "", children }) {
  return <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h2>;
}

export function DialogDescription({ className = "", children }) {
  return <p className={`text-sm text-gray-500 ${className}`}>{children}</p>;
}

export function DialogFooter({ className = "", children }) {
  return <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4 ${className}`}>{children}</div>;
}
