import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { StepComponentProps } from './OnboardingLayout'
import { Play, CheckCircle, Server, AlertCircle } from 'lucide-react'

export function ServerSetup({ onComplete, isComplete }: StepComponentProps) {
  const [serverStarted, setServerStarted] = useState(false)
  
  // Detect if running on macOS using userAgent instead of deprecated platform
  const isMacOS = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent)

  const handleServerStarted = () => {
    setServerStarted(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Start Local Server</CardTitle>
          <CardDescription>
            LM Studio needs to run a local server for Chloe to connect to the AI model.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Server className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Server Details:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Default port: 1234</li>
                  <li>• URL: http://localhost:1234</li>
                  <li>• Auto-starts with LM Studio</li>
                  <li>• Uses minimal resources when idle</li>
                </ul>
              </div>
            </div>
          </div>

          {!serverStarted && (
            <div className="space-y-4">
              <h4 className="font-medium">Start the Server:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  In LM Studio, click on the <strong>&quot;Local Server&quot;</strong> tab (icon looks like
                  &lt;&gt;)
                </li>
                <li>
                  Select the <strong>{isMacOS ? 'gpt-oss-20b-mlx' : 'GPT-OSS'} model</strong> from the
                  dropdown
                </li>
                <li>Keep the default settings (port 1234)</li>
                <li>
                  Click <strong>&quot;Start Server&quot;</strong>
                </li>
                <li>Wait for the green &quot;Server running&quot; status</li>
              </ol>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm">
                      <strong>Tip:</strong> You can enable &quot;Auto-start server&quot; in LM Studio settings
                      so the server starts automatically when you open LM Studio.
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handleServerStarted} className="w-full" size="lg">
                <Play className="mr-2 h-5 w-5" />
                Server is Running
              </Button>
            </div>
          )}

          {serverStarted && (
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Server Successfully Started!</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    The local server is running. Let&apos;s test the connection to make sure everything
                    is working.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {serverStarted && (
        <div className="flex justify-end">
          <Button onClick={onComplete} size="lg">
            Test Connection
          </Button>
        </div>
      )}
    </div>
  )
}
