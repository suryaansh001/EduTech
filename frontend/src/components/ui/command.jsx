/**
 * command component stub
 */

import React from 'react';

export const Command = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="command" {...props}>
    {children}
  </div>
));

export default {
  Command
};
