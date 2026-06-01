import React from 'react';

export const Sonner = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="component" {...props}>
    {children}
  </div>
));

export default Sonner;
