import React from 'react';

export const Inputotp = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="component" {...props}>
    {children}
  </div>
));

export default Inputotp;
