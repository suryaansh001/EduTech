/**
 * pagination component stub
 */

import React from 'react';

export const Pagination = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="pagination" {...props}>
    {children}
  </div>
));

export default {
  Pagination
};
