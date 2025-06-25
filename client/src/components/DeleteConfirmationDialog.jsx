import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

const DeleteConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title = "Delete Item",
  itemName,
  itemType = "item",
  isDeleting = false,
  canDelete = true,
  deleteRestrictionReason,
  children,
  itemDetails,
  destructiveAction = true,
}) => {
  const handleConfirm = () => {
    if (canDelete && !isDeleting) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className={`h-5 w-5 ${destructiveAction ? 'text-destructive' : 'text-amber-500'}`} />
            {title}
          </DialogTitle>
          <DialogDescription asChild>
            <div className='space-y-4'>
              <p>
                Are you sure you want to delete {itemName ? (
                  <>
                    the {itemType} "<strong>{itemName}</strong>"?
                  </>
                ) : (
                  `this ${itemType}?`
                )}
              </p>
              
              {/* item details section */}
              {itemDetails && (
                <div className='p-3 bg-muted rounded-md text-sm'>
                  {itemDetails}
                </div>
              )}

              {/* custom content */}
              {children}

              {/* restriction warning */}
              {!canDelete && deleteRestrictionReason && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Cannot Delete {itemType.charAt(0).toUpperCase() + itemType.slice(1)}</AlertTitle>
                  <AlertDescription>
                    {deleteRestrictionReason}
                  </AlertDescription>
                </Alert>
              )}

              {canDelete && destructiveAction && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    This action cannot be undone. The {itemType} and all its configurations will be permanently removed.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canDelete || isDeleting}
            variant={destructiveAction ? "destructive" : "default"}
            className="w-full sm:w-auto"
          >
            {isDeleting ? 'Deleting...' : `Delete ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;