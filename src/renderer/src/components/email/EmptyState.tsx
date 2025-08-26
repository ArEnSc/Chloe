import React from 'react'
import { Inbox, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEmailStore } from '@/store/emailStore'
import { useEmailSync } from '@/hooks/useEmailSync'

interface EmptyStateProps {
  isInitialLoad?: boolean
  isLoading?: boolean
  error?: string | null
}

export function EmptyState({
  isInitialLoad,
  isLoading,
  error
}: EmptyStateProps): React.JSX.Element {
  const { syncEmails } = useEmailSync()

  if (isInitialLoad) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
        <h3 className="text-lg font-medium mb-2">Loading emails...</h3>
        <p className="text-sm text-muted-foreground">Fetching your emails from local storage</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <Inbox className="h-12 w-12 text-destructive" />
        </div>
        <h3 className="text-lg font-medium mb-2">Unable to load emails</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={syncEmails} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Inbox className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No emails yet</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Your inbox is empty. Click sync to fetch emails from Gmail.
      </p>
      <Button onClick={syncEmails} disabled={isLoading} size="sm" className="gap-2">
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Syncing...' : 'Sync Emails'}
      </Button>
    </div>
  )
}
