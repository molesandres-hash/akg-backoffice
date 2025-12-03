import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWizardStore } from '@/store/wizardStore';

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

      {/* Seconda riga: Direttore, Supervisore, Resp. Certificazione */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        {/* Responsabile Certificazione */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resp. Certificazione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
                placeholder="Es: Responsabile"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
