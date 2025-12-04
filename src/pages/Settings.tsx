import { AppLayout } from '@/components/layout/AppLayout';
import { GeneralSettingsForm } from '@/components/admin/GeneralSettingsForm';
import { DocentiManager } from '@/components/admin/DocentiManager';
import { SupervisoriManager } from '@/components/admin/SupervisoriManager';
import { EntiSediManager } from '@/components/admin/EntiSediManager';
import { PiattaformeFadManager } from '@/components/admin/PiattaformeFadManager';
import { ListeArgomentiManager } from '@/components/admin/ListeArgomentiManager';
import { SystemTemplateSlots } from '@/components/admin/SystemTemplateSlots';
import { TemplateManager } from '@/components/admin/TemplateManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings as SettingsIcon, 
  FileText, 
  FolderOpen, 
  Users, 
  Building2, 
  BookOpen 
} from 'lucide-react';

const Settings = () => {
  return (
    <AppLayout>
      <div className="container max-w-5xl py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-semibold">Impostazioni</h1>
          <p className="text-muted-foreground mt-1">
            Configura le preferenze, i dati predefiniti e i template per la generazione documenti
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto gap-1">
            <TabsTrigger value="general" className="gap-2 text-xs md:text-sm">
              <SettingsIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Generali</span>
            </TabsTrigger>
            <TabsTrigger value="personale" className="gap-2 text-xs md:text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Personale</span>
            </TabsTrigger>
            <TabsTrigger value="organizzazione" className="gap-2 text-xs md:text-sm">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Organizzazione</span>
            </TabsTrigger>
            <TabsTrigger value="contenuti" className="gap-2 text-xs md:text-sm">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Contenuti</span>
            </TabsTrigger>
            <TabsTrigger value="system-templates" className="gap-2 text-xs md:text-sm">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Template Sistema</span>
            </TabsTrigger>
            <TabsTrigger value="user-templates" className="gap-2 text-xs md:text-sm">
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Template Utente</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralSettingsForm />
          </TabsContent>

          <TabsContent value="personale" className="space-y-6">
            <DocentiManager />
            <SupervisoriManager />
          </TabsContent>

          <TabsContent value="organizzazione" className="space-y-6">
            <EntiSediManager />
            <PiattaformeFadManager />
          </TabsContent>

          <TabsContent value="contenuti">
            <ListeArgomentiManager />
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
