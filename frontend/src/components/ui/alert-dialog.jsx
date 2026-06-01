import React from 'react';

export const AlertDialog = ({ children, open, onOpenChange }) => {
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) onOpenChange(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  if (!open) return null;
  return <div className="alert-dialog">{children}</div>;
};

export const AlertDialogTrigger = React.forwardRef(({ children, ...props }, ref) => (
  <button ref={ref} className="alert-dialog-trigger" {...props}>
    {children}
  </button>
));
AlertDialogTrigger.displayName = 'AlertDialogTrigger';

export const AlertDialogContent = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} className="alert-dialog-content" role="alertdialog" {...props}>
    {children}
  </div>
));
AlertDialogContent.displayName = 'AlertDialogContent';

export const AlertDialogHeader = ({ children, ...props }) => (
  <div className="alert-dialog-header" {...props}>{children}</div>
);

export const AlertDialogFooter = ({ children, ...props }) => (
  <div className="alert-dialog-footer" {...props}>{children}</div>
);

export const AlertDialogTitle = React.forwardRef(({ children, ...props }, ref) => (
  <h2 ref={ref} className="alert-dialog-title" {...props}>
    {children}
  </h2>
));
AlertDialogTitle.displayName = 'AlertDialogTitle';

export const AlertDialogDescription = ({ children, ...props }) => (
  <p className="alert-dialog-description" {...props}>{children}</p>
);

export const AlertDialogAction = React.forwardRef(({ children, ...props }, ref) => (
  <button ref={ref} className="alert-dialog-action" {...props}>
    {children}
  </button>
));
AlertDialogAction.displayName = 'AlertDialogAction';

export const AlertDialogCancel = React.forwardRef(({ children, ...props }, ref) => (
  <button ref={ref} className="alert-dialog-cancel" {...props}>
    {children}
  </button>
));
AlertDialogCancel.displayName = 'AlertDialogCancel';

export default {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
