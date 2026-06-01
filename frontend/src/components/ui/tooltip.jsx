/**
 * tooltip component stub
 */

import React from 'react';

export const Tooltip = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="tooltip" {...props}>
    {children}
  </div>
));

export default {
  Tooltip
};
