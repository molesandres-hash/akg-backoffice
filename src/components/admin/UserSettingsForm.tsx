import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2, User, Building, Key } from 'lucide-react';
import { getSettings, saveSettings, type UserSettings } from '@/db/templateDb';
import { toast } from 'sonner';

const defaultSettings: Omit<UserSettings, 'id'> = {
  defaultTrainerName: '',
  defaultTrainerSurname: '',
  defaultTutorName: '',
  defaultTutorSurname: '',
  defaultLocation: '',
  defaultEntityName: '',
  geminiApiKey: '',
  extractionMode: 'standard',
};

export function UserSettingsForm() {
  const [settings, setSettings] = useState<Omit<UserSettings, 'id'>>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await getSettings();
      if (saved) {
        setSettings({
          defaultTrainerName: saved.defaultTrainerName || '',
          defaultTrainerSurname: saved.defaultTrainerSurname || '',
          defaultTutorName: saved.defaultTutorName || '',
          defaultTutorSurname: saved.defaultTutorSurname || '',
          defaultLocation: saved.defaultLocation || '',
          defaultEntityName: saved.defaultEntityName || '',
          geminiApiKey: saved.geminiApiKey || '',
          extractionMode: saved.extractionMode || 'standard',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Omit<UserSettings, 'id'>, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      toast.success('Impostazioni salvate');
    } catch (error) {
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Entity Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="w-5 h-5 text-accent" />
            Dati Ente
          </CardTitle>
          <CardDescription>
            Informazioni dell'ente formativo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entityName">Nome Ente</Label>
              <Input
                id="entityName"
                value={settings.defaultEntityName}
                onChange={(e) => handleChange('defaultEntityName', e.target.value)}
                placeholder="Es: Centro Formazione XYZ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Sede Predefinita</Label>
              <Input
                id="location"
                value={settings.defaultLocation}
                onChange={(e) => handleChange('defaultLocation', e.target.value)}
                placeholder="Es: Via Roma 123, Milano"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personnel Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-accent" />
            Personale Predefinito
          </CardTitle>
          <CardDescription>
            Dati del docente e tutor da usare come default
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-3">Docente</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trainerName">Nome</Label>
                <Input
                  id="trainerName"
                  value={settings.defaultTrainerName}
                  onChange={(e) => handleChange('defaultTrainerName', e.target.value)}
                  placeholder="Es: Mario"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trainerSurname">Cognome</Label>
                <Input
                  id="trainerSurname"
                  value={settings.defaultTrainerSurname}
                  onChange={(e) => handleChange('defaultTrainerSurname', e.target.value)}
                  placeholder="Es: Rossi"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Tutor</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tutorName">Nome</Label>
                <Input
                  id="tutorName"
                  value={settings.defaultTutorName}
                  onChange={(e) => handleChange('defaultTutorName', e.target.value)}
                  placeholder="Es: Laura"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tutorSurname">Cognome</Label>
                <Input
                  id="tutorSurname"
                  value={settings.defaultTutorSurname}
                  onChange={(e) => handleChange('defaultTutorSurname', e.target.value)}
                  placeholder="Es: Bianchi"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="w-5 h-5 text-accent" />
            Configurazione AI
          </CardTitle>
          <CardDescription>
            Chiave API per l'estrazione dati con Google Gemini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="apiKey">Gemini API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={settings.geminiApiKey}
              onChange={(e) => handleChange('geminiApiKey', e.target.value)}
              placeholder="Inserisci la tua API key"
            />
            <p className="text-xs text-muted-foreground">
              La chiave viene salvata solo nel browser locale. Non viene mai inviata a server esterni.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salva Impostazioni
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
