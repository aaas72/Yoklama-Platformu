import React, { useState, useRef, useEffect } from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TableHTMLAttributes,
  HTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
} from "react";
import { Loader2, MoreVertical } from "lucide-react";

// --- Types & Interfaces ---

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  containerClassName?: string;
  placeholder?: string;
}

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

// --- Components ---

export const Label: React.FC<LabelProps> = ({
  children,
  className = "",
  required,
  ...props
}) => (
  <label
    className={`block text-xs font-medium text-gray-700 mb-1 ${className}`}
    {...props}
  >
    {children}
    {required && <span className="text-red-500 ms-0.5">*</span>}
  </label>
);

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = "",
  containerClassName = "",
  required,
  ...props
}) => {
  return (
    <div className={containerClassName}>
      {label && (
        <Label htmlFor={props.id} required={required}>
          {label}
        </Label>
      )}
      <div className="relative rounded-md shadow-sm">
        {icon && React.isValidElement(icon) && (
          <div className="absolute inset-y-0 start-0 ps-2.5 flex items-center pointer-events-none">
            {React.cloneElement(
              icon as React.ReactElement<{ className?: string }>,
              {
                className: "h-4 w-4 text-gray-400",
              }
            )}
          </div>
        )}
        <input
          className={`
            block w-full py-2 bg-white border rounded-md text-sm transition placeholder-gray-400
            focus:ring-1 focus:ring-black focus:border-black
            disabled:bg-gray-50 disabled:text-gray-500
            ${icon ? "ps-9" : "px-3"}
            ${
              error
                ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = "",
  containerClassName = "",
  required,
  placeholder = "Seçiniz",

  ...props
}) => {
  return (
    <div className={containerClassName}>
      {label && (
        <Label htmlFor={props.id} required={required}>
          {label}
        </Label>
      )}
      <select
        className={`
          block w-full px-3 py-2 bg-white border rounded-md text-sm transition
          focus:ring-1 focus:ring-black focus:border-black
          disabled:bg-gray-50 disabled:text-gray-500
          ${
            error
              ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300"
          }
          ${className}
        `}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "sm",
  isLoading = false,
  icon,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed rounded-md";

  const variants = {
    primary: "bg-black text-white hover:bg-gray-800 focus:ring-black shadow-sm",
    secondary:
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-black shadow-sm",
    outline:
      "bg-transparent text-black border border-black hover:bg-gray-50 focus:ring-black",
    ghost:
      "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
  };

  const sizes = {
    xs: "px-3 py-1.5 text-xs",
    sm: "px-4 py-2 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
    icon: "h-9 w-9 p-0",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {children}
        </>
      ) : (
        <>
          {icon && <span className="mr-1.5">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div
    className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
  >
    {children}
  </div>
);

export const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <h4 className="text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
    {title}
  </h4>
);

// --- Table Components ---

export const Table: React.FC<TableHTMLAttributes<HTMLTableElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className="w-full overflow-auto">
    <table className={`w-full caption-bottom text-sm ${className}`} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <thead
    className={`bg-gray-50 border-b border-gray-200 ${className}`}
    {...props}
  >
    {children}
  </thead>
);

export const TableBody: React.FC<HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <tr
    className={`border-b border-gray-100 transition-colors hover:bg-gray-50/50 ${className}`}
    {...props}
  >
    {children}
  </tr>
);

export const TableHead: React.FC<ThHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <th
    className={`h-10 px-4 text-left align-middle text-xs font-semibold text-gray-500 uppercase tracking-wider ${className}`}
    {...props}
  >
    {children}
  </th>
);

export const TableCell: React.FC<TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <td className={`p-4 align-middle text-gray-600 ${className}`} {...props}>
    {children}
  </td>
);

// --- Table Actions Component ---

export const TableActions: React.FC<{
  actions: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    className?: string;
  }[];
}> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
        <MoreVertical className="h-4 w-4" />
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-50 border border-gray-200 py-1">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors ${
                action.className || "text-gray-700"
              }`}
            >
              {action.icon && (
                <span className="w-3.5 h-3.5 flex items-center justify-center">
                  {action.icon}
                </span>
              )}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
