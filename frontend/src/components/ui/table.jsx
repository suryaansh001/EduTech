/**
 * table component stub
 */

import React from 'react';

export const Table = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="table" {...props}>
    {children}
  </div>
));

export default {
  Table
};
