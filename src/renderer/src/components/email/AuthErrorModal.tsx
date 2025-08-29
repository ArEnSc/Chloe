import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export function AuthErrorModal(): React.JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleAuthError = (event: CustomEvent<string>): void => {
      setErrorMessage(event.detail)
      setIsOpen(true)
    }

    window.addEventListener('showAuthError', handleAuthError as EventListener)

    return () => {
      window.removeEventListener('showAuthError', handleAuthError as EventListener)
    }
  }, [])

  const handleOpenSettings = (): void => {
    setIsOpen(false)
    window.dispatchEvent(new CustomEvent('openSettings'))
  }

  if (!errorMessage) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Authentication Required
          </DialogTitle>
          <DialogDescription className="text-left pt-3">{errorMessage}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleOpenSettings}>Open Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
