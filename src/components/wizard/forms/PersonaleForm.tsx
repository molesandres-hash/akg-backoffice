import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWizardStore } from '@/store/wizardStore';
import { 
  getAllDocenti, 
  getAllSupervisori,
  getAllResponsabiliCertificazione,
  type DefaultDocente, 
  type DefaultSupervisore,
  type DefaultResponsabileCertificazione 
} from '@/db/templateDb';

export function PersonaleForm() {
  const { 
    courseData, 
    updateTrainer, 
    updateTutor, 
    updateDirettore,
    updateSupervisore,
    updateResponsabileCertificazione 
  } = useWizardStore();
  const { trainer, tutor, direttore, supervisore, responsabile_certificazione } = courseData;

  const [docentiList, setDocentiList] = useState<DefaultDocente[]>([]);
  const [supervisoriList, setSupervisoriList] = useState<DefaultSupervisore[]>([]);
  const [responsabiliList, setResponsabiliList] = useState<DefaultResponsabileCertificazione[]>([]);

  useEffect(() => {
    getAllDocenti().then(setDocentiList);
    getAllSupervisori().then(setSupervisoriList);
    getAllResponsabiliCertificazione().then(setResponsabiliList);
  }, []);

  const handleDocenteSelect = (value: string) => {
    if (value === 'manual') return;
    const docente = docentiList.find(d => d.id === Number(value));
    if (docente) {
      updateTrainer({
        nome: docente.nome,
        cognome: docente.cognome,
        nome_completo: `${docente.nome} ${docente.cognome}`,
        codice_fiscale: docente.codiceFiscale,
        email: docente.email,
        telefono: docente.telefono
      });
    }
  };

  const handleSupervisoreSelect = (value: string) => {
    if (value === 'manual') return;
    const sup = supervisoriList.find(s => s.id === Number(value));
    if (sup) {
      updateSupervisore({
        nome_completo: `${sup.nome} ${sup.cognome}`,
        qualifica: sup.qualifica
      });
    }
  };

  const handleResponsabileSelect = (value: string) => {
    if (value === 'manual') return;
    const resp = responsabiliList.find(r => r.id === Number(value));
    if (resp) {
      updateResponsabileCertificazione({
        nome_completo: `${resp.nome} ${resp.cognome}`,
        qualifica: 'Responsabile Certificazione',
        data_nascita: resp.dataNascita,
        luogo_nascita: resp.luogoNascita,
        residenza: resp.residenza,
        documento: resp.documento
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Prima riga: Docente e Tutor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Docente/Trainer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Docente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {docentiList.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Seleziona Docente Predefinito</Label>
                <Select onValueChange={handleDocenteSelect}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleziona docente..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">-- Inserisci manualmente --</SelectItem>
                    {docentiList.map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.nome} {d.cognome} - {d.codiceFiscale}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome</Label>
                <Input
                  value={trainer.nome}
                  onChange={(e) => updateTrainer({ 
                    nome: e.target.value,
                    nome_completo: `${e.target.value} ${trainer.cognome}`.trim()
                  })}
                  className="h-9"
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cognome</Label>
                <Input
                  value={trainer.cognome}
                  onChange={(e) => updateTrainer({ 
                    cognome: e.target.value,
                    nome_completo: `${trainer.nome} ${e.target.value}`.trim()
                  })}
                  className="h-9"
                  placeholder="Cognome"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs">Codice Fiscale</Label>
              <Input
                value={trainer.codice_fiscale}
                onChange={(e) => updateTrainer({ codice_fiscale: e.target.value.toUpperCase() })}
                className="h-9 font-mono text-xs"
                placeholder="CODICE FISCALE"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  value={trainer.email || ''}
                  onChange={(e) => updateTrainer({ email: e.target.value })}
                  className="h-9"
                  placeholder="email@esempio.it"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Telefono</Label>
                <Input
                  value={trainer.telefono || ''}
                  onChange={(e) => updateTrainer({ telefono: e.target.value })}
                  className="h-9"
                  placeholder="+39..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tutor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tutor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome</Label>
                <Input
                  value={tutor.nome}
                  onChange={(e) => updateTutor({ 
                    nome: e.target.value,
                    nome_completo: `${e.target.value} ${tutor.cognome}`.trim()
                  })}
                  className="h-9"
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cognome</Label>
                <Input
                  value={tutor.cognome}
                  onChange={(e) => updateTutor({ 
                    cognome: e.target.value,
                    nome_completo: `${tutor.nome} ${e.target.value}`.trim()
                  })}
                  className="h-9"
                  placeholder="Cognome"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs">Codice Fiscale</Label>
              <Input
                value={tutor.codice_fiscale}
                onChange={(e) => updateTutor({ codice_fiscale: e.target.value.toUpperCase() })}
                className="h-9 font-mono text-xs"
                placeholder="CODICE FISCALE"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  value={tutor.email || ''}
                  onChange={(e) => updateTutor({ email: e.target.value })}
                  className="h-9"
                  placeholder="email@esempio.it"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Telefono</Label>
                <Input
                  value={tutor.telefono || ''}
                  onChange={(e) => updateTutor({ telefono: e.target.value })}
                  className="h-9"
                  placeholder="+39..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seconda riga: Direttore, Supervisore */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Direttore */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Direttore del Corso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome Completo</Label>
              <Input
                value={direttore.nome_completo}
                onChange={(e) => updateDirettore({ nome_completo: e.target.value })}
                className="h-9"
                placeholder="Nome e Cognome"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Qualifica</Label>
              <Input
                value={direttore.qualifica}
                onChange={(e) => updateDirettore({ qualifica: e.target.value })}
                className="h-9"
                placeholder="Es: Direttore"
              />
            </div>
          </CardContent>
        </Card>

        {/* Supervisore */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supervisore</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {supervisoriList.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Seleziona Predefinito</Label>
                <Select onValueChange={handleSupervisoreSelect}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">-- Inserisci manualmente --</SelectItem>
                    {supervisoriList.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.nome} {s.cognome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Nome Completo</Label>
              <Input
                value={supervisore?.nome_completo || ''}
                onChange={(e) => updateSupervisore({ nome_completo: e.target.value })}
                className="h-9"
                placeholder="Nome e Cognome"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Qualifica</Label>
              <Input
                value={supervisore?.qualifica || ''}
                onChange={(e) => updateSupervisore({ qualifica: e.target.value })}
                className="h-9"
                placeholder="Es: Supervisore"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Terza riga: Responsabile Certificazione (card più larga) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Responsabile Certificazione</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {responsabiliList.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Seleziona Predefinito</Label>
              <Select onValueChange={handleResponsabileSelect}>
                <SelectTrigger className="h-9 max-w-md">
                  <SelectValue placeholder="Seleziona responsabile..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">-- Inserisci manualmente --</SelectItem>
                  {responsabiliList.map(r => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.nome} {r.cognome} - {r.documento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome Completo</Label>
              <Input
                value={responsabile_certificazione?.nome_completo || ''}
                onChange={(e) => updateResponsabileCertificazione({ nome_completo: e.target.value })}
                className="h-9"
                placeholder="Nome e Cognome"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Qualifica</Label>
              <Input
                value={responsabile_certificazione?.qualifica || ''}
                onChange={(e) => updateResponsabileCertificazione({ qualifica: e.target.value })}
                className="h-9"
                placeholder="Responsabile Certificazione"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data di Nascita</Label>
              <Input
                value={responsabile_certificazione?.data_nascita || ''}
                onChange={(e) => updateResponsabileCertificazione({ data_nascita: e.target.value })}
                className="h-9"
                placeholder="DD/MM/YYYY"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Luogo di Nascita</Label>
              <Input
                value={responsabile_certificazione?.luogo_nascita || ''}
                onChange={(e) => updateResponsabileCertificazione({ luogo_nascita: e.target.value })}
                className="h-9"
                placeholder="Es: Milano (MI)"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Residenza</Label>
              <Input
                value={responsabile_certificazione?.residenza || ''}
                onChange={(e) => updateResponsabileCertificazione({ residenza: e.target.value })}
                className="h-9"
                placeholder="Indirizzo completo"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Documento</Label>
              <Input
                value={responsabile_certificazione?.documento || ''}
                onChange={(e) => updateResponsabileCertificazione({ documento: e.target.value.toUpperCase() })}
                className="h-9 font-mono"
                placeholder="N° Documento"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
