import React from 'react'
import { OnboardingLayout, StepComponentProps } from './OnboardingLayout'
import { LMStudioSetup } from './LMStudioSetup'
import { ModelDownload } from './ModelDownload'
import { ServerSetup } from './ServerSetup'
import { ConnectionTest } from './ConnectionTest'
import { GmailSetup } from './GmailSetup'
import { Download, Cpu, Server, Zap, Mail } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'

const steps = [
  {
    id: 'lm-studio',
    title: 'Install LM Studio',
    description: 'Download and install the AI platform',
    icon: <Download className="w-5 h-5" />,
    component: LMStudioSetup
  },
  {
    id: 'model',
    title: 'Download Model',
    description: 'Get the GPT-OSS AI model',
    icon: <Cpu className="w-5 h-5" />,
    component: ModelDownload
  },
  {
    id: 'server',
    title: 'Start Server',
    description: 'Launch the local AI server',
    icon: <Server className="w-5 h-5" />,
    component: ServerSetup
  },
  {
    id: 'test',
    title: 'Test Connection',
    description: 'Verify AI is working',
    icon: <Zap className="w-5 h-5" />,
    component: ConnectionTest
  },
  {
    id: 'gmail',
    title: 'Connect Gmail',
    description: 'Authenticate your email account',
    icon: <Mail className="w-5 h-5" />,
    component: GmailSetup
  }
]

export function Onboarding() {
  const { setOnboardingCompleted } = useSettingsStore()

  const handleComplete = () => {
    setOnboardingCompleted(true)
    // The App component will automatically render EmailLayout when onboardingCompleted is true
  }

  return <OnboardingLayout steps={steps} onComplete={handleComplete} />
}
