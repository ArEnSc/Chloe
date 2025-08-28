import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { StepComponentProps } from './OnboardingLayout'
import { Mail, CheckCircle, AlertCircle, Shield, Loader2 } from 'lucide-react'
import { ipc } from '../../lib/ipc'
import { useSettingsStore } from '../../store/settingsStore'
import { AUTH_IPC_CHANNELS } from '../../../../shared/types/auth'
import { logInfo, logError } from '@shared/logger'

export function GmailSetup({ onComplete, isComplete }: StepComponentProps) {
  const [authenticating, setAuthenticating] = useState(false)
  const [authStatus, setAuthStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const { googleAuth } = useSettingsStore()
  const isAuthenticated = googleAuth.isAuthenticated

  useEffect(() => {
    // Check if already authenticated
    if (isAuthenticated && googleAuth.userEmail) {
      setAuthStatus('success')
      setUserEmail(googleAuth.userEmail)
    }
  }, [isAuthenticated, googleAuth.userEmail])

  const handleGmailAuth = async () => {
    setAuthenticating(true)
    setAuthStatus('idle')
    setErrorMessage('')

    try {
      if (ipc.isAvailable()) {
        // Clear any previous errors
        useSettingsStore.getState().setGoogleAuth({ error: null })

        // Listen for the OAuth response BEFORE sending the start event
        const handleOAuthComplete = (
          _event: unknown,
          data: {
            error?: string
            accessToken?: string
            refreshToken?: string
            expiresAt?: number
            userEmail?: string
            isAuthenticated?: boolean
          }
        ): void => {
          logInfo('OAuth complete event received:', data)
          setAuthenticating(false)

          if (data.error) {
            logError('OAuth error received:', data.error)
            setAuthStatus('error')
            setErrorMessage(data.error)
          } else {
            logInfo('OAuth success, updating state')
            setAuthStatus('success')
            if (data.userEmail) {
              setUserEmail(data.userEmail)
            }

            useSettingsStore.getState().setGoogleAuth({
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
              userEmail: data.userEmail,
              isAuthenticated: true,
              error: null
            })

            // Auto-advance after 2 seconds on success
            setTimeout(() => {
              onComplete()
            }, 2000)
          }
        }

        // Set up the listener first
        ipc.once(
          AUTH_IPC_CHANNELS.AUTH_GOOGLE_COMPLETE,
          handleOAuthComplete as (...args: unknown[]) => void
        )

        // Then send the start event
        logInfo('Sending google-oauth-start')
        ipc.send(AUTH_IPC_CHANNELS.AUTH_GOOGLE_START)
      } else {
        setAuthenticating(false)
        setAuthStatus('error')
        setErrorMessage('Authentication requires Electron environment')
      }
    } catch (error) {
      setAuthenticating(false)
      setAuthStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connect Your Gmail Account</CardTitle>
          <CardDescription>
            Grant Chloe access to manage your emails securely through Google's OAuth.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Security & Privacy:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Uses Google's official OAuth 2.0 authentication</li>
                  <li>• Chloe never stores your password</li>
                  <li>• You can revoke access anytime from Google settings</li>
                  <li>• All emails are processed locally on your device</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Permissions Requested:</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li>• Read and manage your emails</li>
                  <li>• Send emails on your behalf</li>
                  <li>• Manage labels and filters</li>
                  <li>• Access basic profile information</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleGmailAuth}
              disabled={authenticating || authStatus === 'success'}
              size="lg"
              className="min-w-[200px]"
            >
              {authenticating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : authStatus === 'success' ? (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Connected
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-5 w-5" />
                  Connect Gmail
                </>
              )}
            </Button>
          </div>

          {authStatus === 'success' && userEmail && (
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Successfully Connected!</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connected as: <strong>{userEmail}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Chloe is now ready to help you manage your emails!
                  </p>
                </div>
              </div>
            </div>
          )}

          {authStatus === 'error' && (
            <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Authentication Failed</h4>
                  <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Please try again. Make sure to:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Allow popups for the authentication window</li>
                    <li>• Complete the Google sign-in process</li>
                    <li>• Grant all requested permissions</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {authStatus === 'success' && !authenticating && (
        <div className="flex justify-end">
          <Button onClick={onComplete} size="lg" variant="default">
            Complete Setup
          </Button>
        </div>
      )}
    </div>
  )
}
