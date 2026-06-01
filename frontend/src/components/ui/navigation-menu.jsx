/**
 * navigation-menu component stub
 */

import React from 'react';

export const Navigationmenu = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="navigation-menu" {...props}>
    {children}
  </div>
));

export default {
  Navigationmenu
};
