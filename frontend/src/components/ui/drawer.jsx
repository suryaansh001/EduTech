/**
 * drawer component stub
 */

import React from 'react';

export const Drawer = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="drawer" {...props}>
    {children}
  </div>
));

export default {
  Drawer
};
