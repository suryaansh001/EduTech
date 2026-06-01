import React from 'react';

export const Datatable = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="component" {...props}>
    {children}
  </div>
));

export default Datatable;
