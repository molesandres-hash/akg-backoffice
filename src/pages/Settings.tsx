import { AppLayout } from '@/components/layout/AppLayout';
import { UserSettingsForm } from '@/components/admin/UserSettingsForm';

const Settings = () => {
  return (
    <AppLayout>
      <div className="container max-w-3xl py-8 px-4">
        <UserSettingsForm />
      </div>
    </AppLayout>
  );
};

export default Settings;
