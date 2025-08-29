import React, { useState, Fragment } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import iconPath from '../../../../../resources/icon.png'
import { SkipOnboardingModal } from './SkipOnboardingModal'
import { Button } from '@/components/ui/button'

interface Step {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  component: React.ComponentType<StepComponentProps>
}

export interface StepComponentProps {
  onComplete: () => void
  isComplete: boolean
}

interface OnboardingLayoutProps {
  steps: Step[]
  onComplete: () => void
}

export function OnboardingLayout({ steps, onComplete }: OnboardingLayoutProps): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [showSkipModal, setShowSkipModal] = useState(false)

  const handleStepComplete = (): void => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]))

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = (): void => {
    setShowSkipModal(true)
  }

  const handleConfirmSkip = (): void => {
    setShowSkipModal(false)
    onComplete() // This will call setOnboardingCompleted(true) in Onboarding.tsx
  }

  const handleStepClick = (index: number): void => {
    if (index <= currentStep || completedSteps.has(index)) {
      setCurrentStep(index)
    }
  }

  const CurrentStepComponent = steps[currentStep].component

  return (
    <div className="h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-80 bg-muted/30 p-6 border-r">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <img src={iconPath} alt="Chloe" className="w-12 h-12 rounded-xl shadow-lg" />
            <div>
              <h2 className="text-2xl font-bold">Welcome to Chloe</h2>
              <p className="text-sm text-muted-foreground">Your AI Email Companion</p>
            </div>
          </div>
          <p className="text-muted-foreground">Let&apos;s get you set up in a few simple steps</p>
        </div>

        <nav className="space-y-2">
          {steps.map((step, index) => {
            const isActive = index === currentStep
            const isCompleted = completedSteps.has(index)
            const isAccessible = index <= currentStep || isCompleted

            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                disabled={!isAccessible}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                  isActive && 'bg-primary/10 text-primary',
                  !isActive && isAccessible && 'hover:bg-muted',
                  !isAccessible && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    isActive && 'bg-primary text-primary-foreground',
                    isCompleted && !isActive && 'bg-primary/20 text-primary',
                    !isActive && !isCompleted && 'bg-muted'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{step.title}</div>
                  <div className="text-sm text-muted-foreground">{step.description}</div>
                </div>
              </button>
            )
          })}
        </nav>

        <div className="mt-8 p-4 bg-primary/5 rounded-lg">
          <div className="text-sm text-muted-foreground mb-2">Progress</div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{
                width: `${(completedSteps.size / steps.length) * 100}%`
              }}
            />
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {completedSteps.size} of {steps.length} steps completed
          </div>
        </div>

        <div className="mt-4">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-2" />
            Skip Setup
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-8">
          {/* Progress Steps Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                        index === currentStep && 'bg-primary text-primary-foreground scale-110',
                        completedSteps.has(index) &&
                          index !== currentStep &&
                          'bg-primary/20 text-primary',
                        index > currentStep &&
                          !completedSteps.has(index) &&
                          'bg-muted text-muted-foreground'
                      )}
                    >
                      {completedSteps.has(index) ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-xs mt-2 text-center max-w-[80px]',
                        index === currentStep && 'text-primary font-medium',
                        index > currentStep && !completedSteps.has(index) && 'text-muted-foreground'
                      )}
                    >
                      {step.title.split(' ')[0]}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 mx-2 mt-5',
                        completedSteps.has(index) ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  )}
                </Fragment>
              ))}
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                {steps[currentStep].icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{steps[currentStep].title}</h1>
                <p className="text-lg text-muted-foreground">{steps[currentStep].description}</p>
              </div>
            </div>
          </div>

          <CurrentStepComponent
            onComplete={handleStepComplete}
            isComplete={completedSteps.has(currentStep)}
          />
        </div>
      </div>

      <SkipOnboardingModal
        open={showSkipModal}
        onOpenChange={setShowSkipModal}
        onConfirmSkip={handleConfirmSkip}
      />
    </div>
  )
}
