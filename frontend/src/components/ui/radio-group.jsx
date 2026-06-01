/**
 * radio-group component stub
 */

import React from 'react';

export const Radiogroup = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="radio-group" {...props}>
    {children}
  </div>
));

export default {
  Radiogroup
};
