import { AppLayout } from '@/components/layout/AppLayout';
import { UserSettingsForm } from '@/components/admin/UserSettingsForm';
import { SystemTemplateSlots } from '@/components/admin/SystemTemplateSlots';
import { TemplateManager } from '@/components/admin/TemplateManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, FileText, FolderOpen } from 'lucide-react';

const Settings = () => {
  return (
    <AppLayout>
      <div className="container max-w-4xl py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-semibold">Impostazioni</h1>
          <p className="text-muted-foreground mt-1">
            Configura le preferenze e i template per la generazione documenti
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="gap-2">
              <SettingsIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Generali</span>
            </TabsTrigger>
            <TabsTrigger value="system-templates" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Template Sistema</span>
            </TabsTrigger>
            <TabsTrigger value="user-templates" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Template Utente</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <UserSettingsForm />
          </TabsContent>

          <TabsContent value="system-templates">
            <SystemTemplateSlots />
          </TabsContent>

          <TabsContent value="user-templates">
            <TemplateManager />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
