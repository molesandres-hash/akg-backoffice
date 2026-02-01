import { AppLayout } from '@/components/layout/AppLayout';
import { WizardStepper } from '@/components/wizard/WizardStepper';
import { Step1Input } from '@/components/wizard/Step1Input';
import { DashboardView } from '@/components/wizard/DashboardView';
import { useWizardStore } from '@/store/wizardStore';

const Index = () => {
  const { currentStep, setCurrentStep } = useWizardStore();

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1Input />;
      case 1:
        return <DashboardView />;
      default:
        // Any step > 0 counts as Dashboard now
        return <DashboardView />;
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Stepper */}
        <div className="border-b bg-card/50">
          <div className="container max-w-5xl">
            <WizardStepper
              currentStep={currentStep}
              onStepClick={setCurrentStep}
            />
          </div>
        </div>

        {/* Content */}
        <div className="container max-w-5xl py-8 px-4">
          {renderStep()}
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
