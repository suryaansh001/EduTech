/**
 * popover component stub
 */

import React from 'react';

export const Popover = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="popover" {...props}>
    {children}
  </div>
));

export default {
  Popover
};
