import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Video, Link2, Settings2 } from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';

export function FadSettingsForm() {
  const { courseData, updateFadSettings } = useWizardStore();
  const { fad_settings } = courseData;

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
              onValueChange={(value) => updateFadSettings({ piattaforma: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona piattaforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                <SelectItem value="Zoom">Zoom</SelectItem>
                <SelectItem value="Google Meet">Google Meet</SelectItem>
                <SelectItem value="Webex">Cisco Webex</SelectItem>
                <SelectItem value="GoToMeeting">GoToMeeting</SelectItem>
                <SelectItem value="Altra">Altra</SelectItem>
              </SelectContent>
            </Select>
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
