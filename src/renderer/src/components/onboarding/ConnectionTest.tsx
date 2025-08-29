import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { StepComponentProps } from './OnboardingLayout'
import { CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { ipc } from '../../lib/ipc'

export function ConnectionTest({ onComplete, isComplete }: StepComponentProps) {
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const testConnection = async () => {
    setTesting(true)
    setConnectionStatus('idle')
    setErrorMessage('')

    try {
      const result = await ipc.testLMStudioConnection()

      if (result.success) {
        setConnectionStatus('success')
        // Auto-advance after 2 seconds on success
        setTimeout(() => {
          onComplete()
        }, 2000)
      } else {
        setConnectionStatus('error')
        setErrorMessage(result.error || 'Failed to connect to LM Studio')
      }
    } catch (error) {
      setConnectionStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Connection test failed')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Connection</CardTitle>
          <CardDescription>
            Let's verify that Chloe can connect to LM Studio and the AI model.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Connection Test</h4>
            <p className="text-sm text-muted-foreground">
              Click the button below to test the connection to LM Studio. This will verify that:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• LM Studio server is running on port 1234</li>
              <li>• The GPT-OSS model is loaded</li>
              <li>• Chloe can communicate with the AI</li>
            </ul>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={testConnection}
              disabled={testing || connectionStatus === 'success'}
              size="lg"
              className="min-w-[200px]"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Testing Connection...
                </>
              ) : connectionStatus === 'success' ? (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Connected!
                </>
              ) : connectionStatus === 'error' ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Retry Connection
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>

          {connectionStatus === 'success' && (
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Connection Successful!</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Great! Chloe can now use AI features. Moving to Gmail setup...
                  </p>
                </div>
              </div>
            </div>
          )}

          {connectionStatus === 'error' && (
            <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Connection Failed</h4>
                  <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium">Troubleshooting:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Make sure LM Studio is running</li>
                      <li>• Check that the server is started (green status)</li>
                      <li>• Verify the server is on port 1234</li>
                      <li>• Ensure the GPT-OSS model is selected</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {connectionStatus === 'success' && !testing && (
        <div className="flex justify-end">
          <Button onClick={onComplete} size="lg">
            Continue to Gmail Setup
          </Button>
        </div>
      )}
    </div>
  )
}
