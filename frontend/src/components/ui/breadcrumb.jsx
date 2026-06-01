/**
 * breadcrumb component stub
 */

import React from 'react';

export const Breadcrumb = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="breadcrumb" {...props}>
    {children}
  </div>
));

export default {
  Breadcrumb
};
