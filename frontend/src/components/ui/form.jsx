/**
 * form component stub
 */

import React from 'react';

export const Form = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="form" {...props}>
    {children}
  </div>
));

export default {
  Form
};
