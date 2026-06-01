/**
 * checkbox component stub
 */

import React from 'react';

export const Checkbox = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="checkbox" {...props}>
    {children}
  </div>
));

export default {
  Checkbox
};
