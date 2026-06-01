/**
 * sidebar component stub
 */

import React from 'react';

export const Sidebar = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="sidebar" {...props}>
    {children}
  </div>
));

export default {
  Sidebar
};
