import { AppLayout } from '@/components/layout/AppLayout';
import { WizardStepper } from '@/components/wizard/WizardStepper';
import { Step1Input } from '@/components/wizard/Step1Input';
import { Step2DataReview } from '@/components/wizard/Step2DataReview';
import { Step3TemplateSelect } from '@/components/wizard/Step3TemplateSelect';
import { Step4Generate } from '@/components/wizard/Step4Generate';
import { useWizardStore } from '@/store/wizardStore';

const Index = () => {
  const { currentStep, setCurrentStep } = useWizardStore();

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1Input />;
      case 1:
        return <Step2DataReview />;
      case 2:
        return <Step3TemplateSelect />;
      case 3:
        return <Step4Generate />;
      default:
        return <Step1Input />;
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
