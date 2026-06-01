import React from 'react';

export const Aspectratio = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="component" {...props}>
    {children}
  </div>
));

export default Aspectratio;
