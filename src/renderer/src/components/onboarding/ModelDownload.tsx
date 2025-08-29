import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { StepComponentProps } from './OnboardingLayout'
import { Download, Copy, CheckCircle, Info, AlertCircle } from 'lucide-react'

export function ModelDownload({ onComplete, isComplete }: StepComponentProps) {
  const [modelDownloading, setModelDownloading] = useState(false)
  const [modelInstalled, setModelInstalled] = useState(false)
  const [copiedModelId, setCopiedModelId] = useState(false)

  // Detect if running on macOS using userAgent instead of deprecated platform
  const isMacOS = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent)
  const modelId = isMacOS
    ? 'gpt-oss-20b-mlx' // MLX version for macOS
    : 'lmstudio-ai/gpt-oss-035-octo-12b-v3-GGUF' // GGUF version for Windows/Linux

  const handleCopyModelId = () => {
    navigator.clipboard.writeText(modelId)
    setCopiedModelId(true)
    setTimeout(() => setCopiedModelId(false), 2000)
  }

  const handleDownloadStart = () => {
    setModelDownloading(true)
  }

  const handleModelReady = () => {
    setModelInstalled(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Download GPT-OSS Model</CardTitle>
          <CardDescription>
            GPT-OSS is a powerful open-source language model that will power Chloe's intelligent
            email features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Model Details:</strong>
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • Model:{' '}
                    {isMacOS ? 'GPT-OSS 20B (MLX optimized for Apple Silicon)' : 'GPT-OSS 12B'}
                  </li>
                  <li>• Size: {isMacOS ? '~20 GB download' : '~7-8 GB download'}</li>
                  <li>
                    • RAM Required:{' '}
                    {isMacOS ? '16GB minimum, 32GB recommended' : '8GB minimum, 16GB recommended'}
                  </li>
                  <li>
                    • Performance:{' '}
                    {isMacOS ? 'Optimized for Apple Silicon' : 'Fast responses, high quality'}
                  </li>
                  <li>• Privacy: Runs 100% locally on your machine</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium">Model ID:</h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-background p-2 rounded text-sm font-mono">
                  {modelId}
                </code>
                <Button size="sm" variant="outline" onClick={handleCopyModelId}>
                  {copiedModelId ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {!modelDownloading && (
              <div className="space-y-4">
                <h4 className="font-medium">Instructions:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Open LM Studio</li>
                  <li>Click on the &quot;Search&quot; tab in the left sidebar</li>
                  <li>Paste the model ID above into the search bar</li>
                  <li>Click the download button next to the model</li>
                  <li>Wait for the download to complete (this may take a few minutes)</li>
                </ol>
                <Button onClick={handleDownloadStart} className="w-full" size="lg">
                  <Download className="mr-2 h-5 w-5" />
                  I&apos;m Ready to Download
                </Button>
              </div>
            )}

            {modelDownloading && !modelInstalled && (
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Download in Progress</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        The model download can take 5-15 minutes depending on your internet speed.
                        You can monitor the progress in LM Studio&apos;s download section.
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleModelReady} variant="outline" className="w-full">
                  Model Download Complete
                </Button>
              </div>
            )}

            {modelInstalled && (
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Model Successfully Installed!</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      GPT-OSS is now ready. Next, we&apos;ll start the local server so Chloe can
                      connect to it.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {modelInstalled && (
        <div className="flex justify-end">
          <Button onClick={onComplete} size="lg">
            Continue to Server Setup
          </Button>
        </div>
      )}
    </div>
  )
}
