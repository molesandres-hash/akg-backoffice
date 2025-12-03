import { AppLayout } from '@/components/layout/AppLayout';
import { TemplateManager } from '@/components/admin/TemplateManager';

const Templates = () => {
  return (
    <AppLayout>
      <div className="container max-w-5xl py-8 px-4">
        <TemplateManager />
      </div>
    </AppLayout>
  );
};

export default Templates;
