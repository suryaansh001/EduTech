/**
 * Dropdown Menu component stub
 * Can be replaced with shadcn/ui dropdown-menu
 */

import React from 'react';

export const DropdownMenu = ({ children }) => {
  return <div className="dropdown-menu">{children}</div>;
};

export const DropdownMenuTrigger = React.forwardRef(({ children, ...props }, ref) => (
  <button ref={ref} className="dropdown-menu-trigger" {...props}>
    {children}
  </button>
));

DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

export const DropdownMenuContent = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="dropdown-menu-content" {...props}>
    {children}
  </div>
));

DropdownMenuContent.displayName = 'DropdownMenuContent';

export const DropdownMenuItem = React.forwardRef(({ children, ...props }, ref) => (
  <button ref={ref} className="dropdown-menu-item" {...props}>
    {children}
  </button>
));

DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuSeparator = () => <div className="dropdown-menu-separator" />;

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export const DropdownMenuLabel = React.forwardRef(({ children, ...props }, ref) => (
  <span ref={ref} className="dropdown-menu-label" {...props}>
    {children}
  </span>
));

DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export default {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
