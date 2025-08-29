import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Settings } from 'lucide-react'

interface SkipOnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmSkip: () => void
}

export function SkipOnboardingModal({
  open,
  onOpenChange,
  onConfirmSkip
}: SkipOnboardingModalProps): React.JSX.Element {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Skip Setup?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to skip the setup process? You won&apos;t be able to use all
              features until you complete the setup.
            </p>
            <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
              <Settings className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <p className="text-sm">
                You can always restart the setup process later from the Settings menu.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continue Setup</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmSkip}
            className="bg-secondary hover:bg-secondary/80 text-black"
          >
            Skip for Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
