/**
 * slider component stub
 */

import React from 'react';

export const Slider = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="slider" {...props}>
    {children}
  </div>
));

export default {
  Slider
};
