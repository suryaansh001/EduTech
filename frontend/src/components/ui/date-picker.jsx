/**
 * date-picker component stub
 */

import React from 'react';

export const Datepicker = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="date-picker" {...props}>
    {children}
  </div>
));

export default {
  Datepicker
};
