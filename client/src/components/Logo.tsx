import React from "react";
import { School } from "lucide-react";

interface LogoProps {
  className?: string;
  iconClassName?: string;
}

const Logo: React.FC<LogoProps> = ({
  className = "",
  iconClassName = "h-6 w-6",
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className=" text-white p-2 rounded-lg shadow-sm">
        <School className={iconClassName} />
      </div>
      <span className="font-bold text-xl tracking-tight">
        HDSM
      </span>
    </div>
  );
};

export default Logo;
