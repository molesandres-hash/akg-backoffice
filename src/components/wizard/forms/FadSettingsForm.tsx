import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Video, Link2, Settings2, Loader2, FileSignature } from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';
import { getAllPiattaforme, type DefaultPiattaformaFad } from '@/db/templateDb';
import { Switch } from '@/components/ui/switch';

export function FadSettingsForm() {
  const { courseData, updateFadSettings } = useWizardStore();
  const { fad_settings } = courseData;
  const [piattaforme, setPiattaforme] = useState<DefaultPiattaformaFad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPiattaforme = async () => {
      try {
        const data = await getAllPiattaforme();
        console.log("Loaded piattaforme:", data);
        setPiattaforme(data);
      } catch (error) {
        console.error("Error loading piattaforme:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPiattaforme();
  }, []);

  const handlePiattaformaChange = (value: string) => {
    const selectedPlatform = piattaforme.find(p => p.nome === value);

    updateFadSettings({
      piattaforma: value,
      // Auto-fill details if available
      ...(selectedPlatform && {
        zoom_link: selectedPlatform.linkBase || fad_settings.zoom_link,
        zoom_meeting_id: selectedPlatform.idRiunione || fad_settings.zoom_meeting_id,
        zoom_passcode: selectedPlatform.password || fad_settings.zoom_passcode,
      })
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Platform Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Impostazioni Piattaforma
          </CardTitle>
          <CardDescription>
            Configurazione della piattaforma FAD
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Piattaforma</Label>
            <Select
              value={fad_settings.piattaforma}
              onValueChange={handlePiattaformaChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Caricamento..." : "Seleziona piattaforma"} />
              </SelectTrigger>
              <SelectContent>
                {piattaforme.length > 0 ? (
                  piattaforme.map((p) => (
                    <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="Nessuna">Nessuna piattaforma salvata</SelectItem>
                )}
                <SelectItem value="Altra">Altra</SelectItem>
              </SelectContent>
            </Select>
            {piattaforme.length === 0 && !loading && (
              <p className="text-xs text-muted-foreground text-orange-600">
                Consiglio: configura le piattaforme nelle Impostazioni per averle qui.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Modalità Gestione</Label>
            <Select
              value={fad_settings.modalita_gestione}
              onValueChange={(value) => updateFadSettings({ modalita_gestione: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona modalità" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sincrona">Sincrona</SelectItem>
                <SelectItem value="Asincrona">Asincrona</SelectItem>
                <SelectItem value="Mista">Mista</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Modalità Valutazione</Label>
            <Select
              value={fad_settings.modalita_valutazione}
              onValueChange={(value) => updateFadSettings({ modalita_valutazione: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona valutazione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Test Scritto">Test Scritto</SelectItem>
                <SelectItem value="Test Online">Test Online</SelectItem>
                <SelectItem value="Colloquio">Colloquio</SelectItem>
                <SelectItem value="Prova Pratica">Prova Pratica</SelectItem>
                <SelectItem value="Project Work">Project Work</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Obiettivi Didattici</Label>
            <Textarea
              value={fad_settings.obiettivi_didattici}
              onChange={(e) => updateFadSettings({ obiettivi_didattici: e.target.value })}
              placeholder="Descrivi gli obiettivi didattici del corso..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between space-x-2 pt-2 border-t">
            <Label htmlFor="include-signature" className="flex flex-col space-y-1">
              <span className="flex items-center gap-2 font-medium">
                <FileSignature className="w-4 h-4" />
                Includi Firma Docente
              </span>
              <span className="font-normal text-xs text-muted-foreground">
                Inserisce l'immagine della firma nel Modello B
              </span>
            </Label>
            <Switch
              id="include-signature"
              checked={fad_settings.includeSignature}
              onCheckedChange={(checked) => updateFadSettings({ includeSignature: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Meeting Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Video className="w-4 h-4" />
            Dettagli Riunione
          </CardTitle>
          <CardDescription>
            Credenziali di accesso alla piattaforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>ID Riunione / Meeting ID</Label>
            <Input
              value={fad_settings.zoom_meeting_id}
              onChange={(e) => updateFadSettings({ zoom_meeting_id: e.target.value })}
              placeholder="Es: 123 456 789"
            />
          </div>

          <div className="space-y-2">
            <Label>Passcode</Label>
            <Input
              value={fad_settings.zoom_passcode}
              onChange={(e) => updateFadSettings({ zoom_passcode: e.target.value })}
              placeholder="Passcode riunione"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Link2 className="w-3 h-3" />
              Link di Accesso
            </Label>
            <Input
              value={fad_settings.zoom_link}
              onChange={(e) => updateFadSettings({ zoom_link: e.target.value })}
              placeholder="https://..."
              type="url"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
