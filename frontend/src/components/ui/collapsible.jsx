/**
 * collapsible component stub
 */

import React from 'react';

export const Collapsible = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="collapsible" {...props}>
    {children}
  </div>
));

export default {
  Collapsible
};
