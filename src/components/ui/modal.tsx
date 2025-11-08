import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: () => Promise<void> | void;
  disableSubmit?: boolean;
  hideFooter?: boolean;
  isSubmitting?: boolean;
  validationError?: string;
  submitSuccess?: boolean;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  onSubmit,
  disableSubmit,
  hideFooter = false,
  isSubmitting = false,
  validationError,
  submitSuccess
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg p-0 bg-background/80 backdrop-blur-lg border-b border-white/10 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
        aria-describedby={description ? "dialog-description" : undefined}>
        
        {/* Glassmorphism container */}
        <div className="relative p-6 rounded-lg 
          before:absolute before:inset-0 before:-z-10 before:rounded-lg 
          after:absolute after:inset-0 after:-z-20 after:rounded-lg">
          <DialogTitle className="text-xl font-semibold mb-4">{title}</DialogTitle>
          {description && (
            <DialogDescription id="dialog-description" className="text-sm text-muted-foreground mb-4">
              {description}
            </DialogDescription>
          )}
          
          {children}

          {!hideFooter && (
            <div className="flex gap-2 justify-end mt-6">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="bg-background/50 hover:bg-background/70 border-border/50"
              >
                {cancelLabel}
              </Button>
              {onSubmit && (
                <Button 
                  onClick={onSubmit}
                  disabled={disableSubmit || isSubmitting}
                  className={`relative ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'bg-primary hover:bg-primary/90'}`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="opacity-0">{submitLabel}</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      </div>
                    </>
                  ) : submitLabel}
                </Button>
              )}
            </div>
          )}
          
          {/* Validation Error Message */}
          {validationError && (
            <div className="mt-2 text-sm text-red-500 bg-red-50 p-2 rounded">
              {validationError}
            </div>
          )}
          
          {/* Success Message */}
          {submitSuccess && (
            <div className="mt-2 text-sm text-green-500 bg-green-50 p-2 rounded flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Data berhasil disimpan
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}