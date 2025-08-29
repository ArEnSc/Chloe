import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { StepComponentProps } from './OnboardingLayout'
import { Download, ExternalLink, CheckCircle } from 'lucide-react'

export function LMStudioSetup({ onComplete, isComplete }: StepComponentProps) {
  const [downloadStarted, setDownloadStarted] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  const handleDownload = () => {
    setDownloadStarted(true)
    window.open('https://lmstudio.ai', '_blank')
  }

  const handleVerifyInstallation = () => {
    setIsInstalled(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Download LM Studio</CardTitle>
          <CardDescription>
            LM Studio is a free, private desktop app for running local AI models. It's required for
            Chloe's intelligent email features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Why LM Studio?</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>100% private - your emails never leave your computer</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Free to use with no API costs</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Works offline once models are downloaded</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Supports the latest open-source AI models</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleDownload}
              disabled={downloadStarted}
              className="w-full"
              size="lg"
            >
              {downloadStarted ? (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Download Started
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Download LM Studio
                </>
              )}
            </Button>

            {downloadStarted && !isInstalled && (
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Installation Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>The download should start automatically in your browser</li>
                  <li>
                    Once downloaded, run the installer (LMStudio-{getOS()}-x64.{getExt()})
                  </li>
                  <li>Follow the installation wizard</li>
                  <li>Launch LM Studio when installation completes</li>
                </ol>
              </div>
            )}

            {downloadStarted && (
              <Button
                onClick={handleVerifyInstallation}
                variant="outline"
                disabled={isInstalled}
                className="w-full"
              >
                {isInstalled ? (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    Installation Verified
                  </>
                ) : (
                  "I've Installed LM Studio"
                )}
              </Button>
            )}
          </div>

          {isInstalled && (
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Great! LM Studio is installed</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Now let's download the AI model that powers Chloe's intelligent features.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isInstalled && (
        <div className="flex justify-end">
          <Button onClick={onComplete} size="lg">
            Continue to Model Setup
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

function getOS(): string {
  const platform = navigator.platform.toLowerCase()
  if (platform.includes('win')) return 'Windows'
  if (platform.includes('mac')) return 'macOS'
  return 'Linux'
}

function getExt(): string {
  const platform = navigator.platform.toLowerCase()
  if (platform.includes('win')) return 'exe'
  if (platform.includes('mac')) return 'dmg'
  return 'AppImage'
}
