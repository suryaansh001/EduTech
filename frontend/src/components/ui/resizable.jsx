/**
 * resizable component stub
 */

import React from 'react';

export const Resizable = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="resizable" {...props}>
    {children}
  </div>
));

export default {
  Resizable
};
