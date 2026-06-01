/**
 * context-menu component stub
 */

import React from 'react';

export const Contextmenu = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="context-menu" {...props}>
    {children}
  </div>
));

export default {
  Contextmenu
};
