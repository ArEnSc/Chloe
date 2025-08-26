import { format } from 'date-fns'
import { RefreshCw, CheckCircle, AlertCircle, Settings, Bot, Wifi, WifiOff } from 'lucide-react'
import { useEmailStore } from '@/store/emailStore'
import { useLMStudioStore } from '@/store/lmStudioStore'
import { useEmailSync } from '@/hooks/useEmailSync'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { JSX } from 'react'

export function SyncStatus(): JSX.Element {
  const { isLoading, lastSyncTime, error, syncProgress } = useEmailStore()
  const { syncEmails } = useEmailSync()
  const { isConnected, isAutoConnecting, isValidating, model } = useLMStudioStore()

  const handleOpenSettings = (): void => {
    // Dispatch a custom event to open settings
    window.dispatchEvent(new CustomEvent('open-settings'))
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button
          variant="ghost"
          size="sm"
          onClick={syncEmails}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          {isLoading ? 'Syncing...' : 'Sync'}
        </Button>

        {!isLoading && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-1">
            {/* Email Sync Status */}
            <div className="flex items-center gap-2">
              {error && error.includes('Not authenticated') ? (
                <button
                  onClick={handleOpenSettings}
                  className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer"
                >
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="underline underline-offset-2">
                    Please connect Gmail in Settings to sync emails
                  </span>
                  <Settings className="h-3.5 w-3.5" />
                </button>
              ) : lastSyncTime ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Last synced: {format(lastSyncTime, 'MMM d, h:mm a')}</span>
                </>
              ) : (
                <span>Not synced yet</span>
              )}
            </div>

            {/* Separator */}
            <div className="h-4 w-px bg-border" />

            {/* LM Studio Status */}
            <div className="flex items-center gap-2">
              {isAutoConnecting || isValidating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs">Connecting to LM Studio...</span>
                </>
              ) : isConnected ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <Wifi className="h-4 w-4 text-green-600" />
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs">
                    LM Studio: {model ? model.split('/').pop() : 'Connected'}
                  </span>
                </>
              ) : (
                <button
                  onClick={handleOpenSettings}
                  className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer"
                >
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">LM Studio offline</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sync Progress Indicator */}
      {isLoading && syncProgress && (
        <div className="px-4 py-2 border-b bg-muted/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{syncProgress.message}</span>
            <span className="text-muted-foreground font-mono">
              {syncProgress.current}/{syncProgress.total}
            </span>
          </div>
          <div className="mt-2 w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
