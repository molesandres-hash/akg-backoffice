import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2, Key } from 'lucide-react';
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
};

export function GeneralSettingsForm() {
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
