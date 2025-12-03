import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWizardStore } from '@/store/wizardStore';

export function PersonaleForm() {
  const { courseData, updateTrainer, updateTutor, updateDirettore } = useWizardStore();
  const { trainer, tutor, direttore } = courseData;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        </CardContent>
      </Card>

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
              placeholder="Es: Supervisore"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
