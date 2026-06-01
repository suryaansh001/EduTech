/**
 * menubar component stub
 */

import React from 'react';

export const Menubar = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="menubar" {...props}>
    {children}
  </div>
));

export default {
  Menubar
};
