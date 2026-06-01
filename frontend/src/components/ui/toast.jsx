/**
 * toast component stub
 */

import React from 'react';

export const Toast = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="toast" {...props}>
    {children}
  </div>
));

export default {
  Toast
};
