/**
 * calendar component stub
 */

import React from 'react';

export const Calendar = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="calendar" {...props}>
    {children}
  </div>
));

export default {
  Calendar
};
