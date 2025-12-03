import { Check, FileText, PenLine, FileDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const steps = [
  { label: 'Input AI', icon: Sparkles, description: 'Incolla i dati grezzi' },
  { label: 'Revisione', icon: PenLine, description: 'Correggi e completa' },
  { label: 'Template', icon: FileText, description: 'Scegli il modello' },
  { label: 'Genera', icon: FileDown, description: 'Scarica i documenti' },
];

export function WizardStepper({ currentStep, onStepClick }: WizardStepperProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between max-w-2xl mx-auto px-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isPending = index > currentStep;
          const canClick = index <= currentStep && onStepClick;

          return (
            <div key={step.label} className="flex items-center">
              {/* Step */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => canClick && onStepClick(index)}
                  disabled={!canClick}
                  className={cn(
                    "step-indicator transition-all duration-300",
                    isCompleted && "step-indicator-completed",
                    isActive && "step-indicator-active scale-110",
                    isPending && "step-indicator-pending",
                    canClick && "cursor-pointer hover:scale-105"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </button>
                <div className="mt-2 text-center">
                  <p className={cn(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-4">
                  <div className={cn(
                    "h-0.5 rounded-full transition-colors duration-300",
                    index < currentStep ? "bg-accent" : "bg-border"
                  )} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
