import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Save, Loader2, Key, Zap, Layers, ShieldCheck } from 'lucide-react';
import { getSettings, saveSettings, type UserSettings, type ExtractionMode } from '@/db/templateDb';
import { geminiClient } from '@/services/extraction';
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
          extractionMode: saved.extractionMode || 'standard',
        });
        // Sync API key to localStorage for client use
        if (saved.geminiApiKey) {
          localStorage.setItem('gemini_api_key', saved.geminiApiKey);
        }
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

  const handleModeChange = (value: ExtractionMode) => {
    setSettings(prev => ({ ...prev, extractionMode: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      // Sync API key to localStorage
      if (settings.geminiApiKey) {
        localStorage.setItem('gemini_api_key', settings.geminiApiKey);
        geminiClient.setApiKey(settings.geminiApiKey);
      }
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

      {/* Extraction Mode */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent" />
            Modalità Estrazione
          </CardTitle>
          <CardDescription>
            Scegli la strategia di estrazione dati più adatta alle tue esigenze
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={settings.extractionMode} 
            onValueChange={handleModeChange}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border/50 hover:border-accent/50 transition-colors">
              <RadioGroupItem value="standard" id="standard" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="standard" className="flex items-center gap-2 cursor-pointer font-medium">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Standard (Veloce)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Singola chiamata API. Veloce ed economica, ideale per input semplici e ben strutturati.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border/50 hover:border-accent/50 transition-colors">
              <RadioGroupItem value="multi-step" id="multi-step" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="multi-step" className="flex items-center gap-2 cursor-pointer font-medium">
                  <Layers className="w-4 h-4 text-blue-500" />
                  3 Step (Preciso)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Tre chiamate separate: calendario, ID/metadati, partecipanti. Massima precisione per input complessi.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border/50 hover:border-accent/50 transition-colors">
              <RadioGroupItem value="double-check" id="double-check" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="double-check" className="flex items-center gap-2 cursor-pointer font-medium">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Doppia Verifica
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Due estrazioni parallele con confronto automatico. Segnala discrepanze per revisione manuale.
                </p>
              </div>
            </div>
          </RadioGroup>
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
