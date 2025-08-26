import React, { useEffect, useRef } from 'react'
import { EmailLayout } from './components/email/EmailLayout'
import { Settings } from './components/Settings'
import { useEmailStore } from './store/emailStore'
import { useLMStudioStore } from './store/lmStudioStore'
import { logError, logInfo } from '@shared/logger'

function App(): React.JSX.Element {
  // Initialize email syncing
  const initializeEmailSync = useEmailStore((state) => state.initializeEmailSync)

  useEffect(() => {
    initializeEmailSync()
  }, [initializeEmailSync])

  // Auto-connect to LM Studio using the new store
  const { url, isConnected, isValidating, isAutoConnecting, connect, setAutoConnecting } =
    useLMStudioStore()

  // Track retry attempts and timeouts
  const retryCount = useRef(0)
  const retryTimeouts = useRef<Set<NodeJS.Timeout>>(new Set())

  useEffect(() => {
    // Clear any stale auto-connecting state on mount
    if (isAutoConnecting) {
      logInfo('Clearing stale auto-connecting state')
      setAutoConnecting(false)
    }

    // Cleanup function to clear all timeouts
    return () => {
      retryTimeouts.current.forEach((timeout) => clearTimeout(timeout))
      retryTimeouts.current.clear()
    }
  }, [isAutoConnecting, setAutoConnecting])

  useEffect(() => {
    // Reset retry count when connected
    if (isConnected) {
      retryCount.current = 0
    }
  }, [isConnected])

  useEffect(() => {
    // Auto-connect if we have a URL saved but not connected
    if (url && !isConnected && !isValidating && !isAutoConnecting) {
      // Calculate delay with exponential backoff
      const baseDelay = 3000 // 3 seconds
      const maxDelay = 60000 // 60 seconds max
      const delay = Math.min(baseDelay * Math.pow(2, retryCount.current), maxDelay)

      logInfo(`Scheduling LM Studio auto-connect attempt ${retryCount.current + 1} in ${delay}ms`)

      const autoConnectDelay = setTimeout(() => {
        retryTimeouts.current.delete(autoConnectDelay)
        logInfo('Auto-connecting to LM Studio', { url, attempt: retryCount.current + 1 })

        setAutoConnecting(true)

        connect()
          .then(() => {
            logInfo('Auto-connect successful')
            retryCount.current = 0 // Reset on success
            setAutoConnecting(false)
          })
          .catch((error) => {
            logError('Auto-connect failed:', error)
            setAutoConnecting(false)

            // Increment retry count for next attempt
            retryCount.current++

            // Stop retrying after 5 attempts
            if (retryCount.current >= 5) {
              logInfo('Max retry attempts reached, stopping auto-connect')
              retryCount.current = 0
            }
          })
      }, delay)

      retryTimeouts.current.add(autoConnectDelay)

      return () => {
        clearTimeout(autoConnectDelay)
        retryTimeouts.current.delete(autoConnectDelay)
      }
    }
  }, [url, isConnected, isValidating, isAutoConnecting, connect, setAutoConnecting])

  return (
    <>
      <EmailLayout />
      <Settings />
    </>
  )
}

export default App
