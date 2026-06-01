/**
 * hover-card component stub
 */

import React from 'react';

export const Hovercard = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="hover-card" {...props}>
    {children}
  </div>
));

export default {
  Hovercard
};
