import React from 'react'
import { Inbox, RefreshCw, Loader2, Star, Send, FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEmailStore } from '@/store/emailStore'

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
  const syncEmails = useEmailStore((state) => state.syncEmails)
  const selectedFolderId = useEmailStore((state) => state.selectedFolderId)

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

  // Get folder-specific content
  const getFolderContent = (): {
    icon: typeof Inbox
    title: string
    message: string
    showSyncButton: boolean
  } => {
    switch (selectedFolderId) {
      case 'trash':
        return {
          icon: Trash2,
          title: 'Trash is empty',
          message:
            'Deleted emails will appear here. Items in trash are automatically deleted after 30 days.',
          showSyncButton: false
        }
      case 'drafts':
        return {
          icon: FileText,
          title: 'No drafts',
          message: 'Email drafts you compose will be saved here automatically.',
          showSyncButton: false
        }
      case 'sent':
        return {
          icon: Send,
          title: 'No sent emails',
          message: 'Emails you send will appear here.',
          showSyncButton: false
        }
      case 'important':
        return {
          icon: Star,
          title: 'No starred emails',
          message: 'Star important emails to easily find them here later.',
          showSyncButton: false
        }
      case 'inbox':
      default:
        return {
          icon: Inbox,
          title: 'No emails yet',
          message: 'Your inbox is empty. Click sync to fetch emails from Gmail.',
          showSyncButton: true
        }
    }
  }

  const { icon: Icon, title, message, showSyncButton } = getFolderContent()

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">{message}</p>
      {showSyncButton && (
        <Button onClick={syncEmails} disabled={isLoading} size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Syncing...' : 'Sync Emails'}
        </Button>
      )}
    </div>
  )
}
