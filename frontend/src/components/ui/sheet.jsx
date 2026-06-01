/**
 * sheet component stub
 */

import React from 'react';

export const Sheet = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="sheet" {...props}>
    {children}
  </div>
));

export default {
  Sheet
};
