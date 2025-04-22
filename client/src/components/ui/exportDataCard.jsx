import React from 'react';

const Card = ({ children, className = "" }) => (
  <div className={`rounded-lg border bg-white shadow ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`p-6 border-b ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const Alert = ({ children, variant, className = "" }) => {
  const baseClasses = "p-4 rounded-md mb-4 border";
  const variantClasses = variant === "destructive" 
    ? "bg-red-50 text-red-800 border-red-200" 
    : "bg-green-50 text-green-800 border-green-200";
  
  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </div>
  );
};

const AlertDescription = ({ children }) => (
  <div className="text-sm">{children}</div>
);

export { Card, CardHeader, CardTitle, CardContent, Alert, AlertDescription };