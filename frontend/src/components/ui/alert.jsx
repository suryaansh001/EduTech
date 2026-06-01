import React from 'react';

export const Alert = React.forwardRef(({ children, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={`alert alert-${variant}`}
    role="alert"
    {...props}
  >
    {children}
  </div>
));
Alert.displayName = 'Alert';

export const AlertTitle = React.forwardRef(({ children, ...props }, ref) => (
  <h5 ref={ref} className="alert-title" {...props}>
    {children}
  </h5>
));
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="alert-description" {...props}>
    {children}
  </div>
));
AlertDescription.displayName = 'AlertDescription';

export default {
  Alert,
  AlertTitle,
  AlertDescription,
};
