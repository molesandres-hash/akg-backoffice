import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, ArrowRight, Plus, Trash2, Users, Calendar, BookOpen } from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';
import type { Partecipante, Sessione } from '@/types/extraction';

export function Step2DataReview() {
  const { 
    courseData, 
    setCourseData, 
    nextStep, 
    prevStep,
    addPartecipante,
    updatePartecipante,
    removePartecipante,
    addSessione,
    updateSessione,
    removeSessione,
  } = useWizardStore();

  const handleCourseChange = (field: string, value: string | number) => {
    setCourseData({ [field]: value });
  };

  const handleAddPartecipante = () => {
    addPartecipante({
      nome: '',
      cognome: '',
      codiceFiscale: '',
      email: '',
      telefono: '',
    });
  };

  const handleAddSessione = () => {
    addSessione({
      data: '',
      oraInizio: '',
      oraFine: '',
      argomento: '',
      sede: '',
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-semibold mb-2">
          Revisione Dati
        </h2>
        <p className="text-muted-foreground">
          Verifica e correggi i dati estratti dall'AI prima di procedere
        </p>
      </div>

      <Tabs defaultValue="corso" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="corso" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Corso
          </TabsTrigger>
          <TabsTrigger value="partecipanti" className="gap-2">
            <Users className="w-4 h-4" />
            Partecipanti ({courseData.partecipanti.length})
          </TabsTrigger>
          <TabsTrigger value="lezioni" className="gap-2">
            <Calendar className="w-4 h-4" />
            Lezioni ({courseData.sessioni.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="corso" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Informazioni Corso</CardTitle>
              <CardDescription>Dati generali del corso e del personale</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titoloCorso">Titolo Corso</Label>
                  <Input
                    id="titoloCorso"
                    value={courseData.titoloCorso}
                    onChange={(e) => handleCourseChange('titoloCorso', e.target.value)}
                    placeholder="Es: Corso Sicurezza sul Lavoro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ente">Ente</Label>
                  <Input
                    id="ente"
                    value={courseData.ente}
                    onChange={(e) => handleCourseChange('ente', e.target.value)}
                    placeholder="Es: Ente Formativo XYZ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idCorso">ID Corso</Label>
                  <Input
                    id="idCorso"
                    value={courseData.idCorso}
                    onChange={(e) => handleCourseChange('idCorso', e.target.value)}
                    placeholder="Es: CRS-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idSezione">ID Sezione</Label>
                  <Input
                    id="idSezione"
                    value={courseData.idSezione}
                    onChange={(e) => handleCourseChange('idSezione', e.target.value)}
                    placeholder="Es: SEZ-A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oreTotali">Ore Totali</Label>
                  <Input
                    id="oreTotali"
                    type="number"
                    value={courseData.oreTotali}
                    onChange={(e) => handleCourseChange('oreTotali', parseInt(e.target.value) || 0)}
                    placeholder="Es: 16"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sede">Sede</Label>
                <Input
                  id="sede"
                  value={courseData.sede}
                  onChange={(e) => handleCourseChange('sede', e.target.value)}
                  placeholder="Es: Via Roma 123, Milano"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-secondary/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Docente</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nome</Label>
                      <Input
                        value={courseData.docenteNome}
                        onChange={(e) => handleCourseChange('docenteNome', e.target.value)}
                        placeholder="Nome"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Cognome</Label>
                      <Input
                        value={courseData.docenteCognome}
                        onChange={(e) => handleCourseChange('docenteCognome', e.target.value)}
                        placeholder="Cognome"
                        className="h-9"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-secondary/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Tutor</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nome</Label>
                      <Input
                        value={courseData.tutorNome}
                        onChange={(e) => handleCourseChange('tutorNome', e.target.value)}
                        placeholder="Nome"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Cognome</Label>
                      <Input
                        value={courseData.tutorCognome}
                        onChange={(e) => handleCourseChange('tutorCognome', e.target.value)}
                        placeholder="Cognome"
                        className="h-9"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partecipanti" className="mt-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Lista Partecipanti</CardTitle>
                <CardDescription>Modifica o aggiungi partecipanti al corso</CardDescription>
              </div>
              <Button onClick={handleAddPartecipante} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Aggiungi
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cognome</TableHead>
                      <TableHead>Codice Fiscale</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseData.partecipanti.map((p, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <Input
                            value={p.nome}
                            onChange={(e) => updatePartecipante(index, { ...p, nome: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={p.cognome}
                            onChange={(e) => updatePartecipante(index, { ...p, cognome: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={p.codiceFiscale}
                            onChange={(e) => updatePartecipante(index, { ...p, codiceFiscale: e.target.value.toUpperCase() })}
                            className="h-8 font-mono text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={p.email || ''}
                            onChange={(e) => updatePartecipante(index, { ...p, email: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removePartecipante(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {courseData.partecipanti.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nessun partecipante. Clicca "Aggiungi" per inserirne uno.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lezioni" className="mt-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Calendario Lezioni</CardTitle>
                <CardDescription>Modifica date, orari e argomenti delle lezioni</CardDescription>
              </div>
              <Button onClick={handleAddSessione} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Aggiungi
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ora Inizio</TableHead>
                      <TableHead>Ora Fine</TableHead>
                      <TableHead>Argomento</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseData.sessioni.map((s, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <Input
                            value={s.data}
                            onChange={(e) => updateSessione(index, { ...s, data: e.target.value })}
                            placeholder="DD/MM/YYYY"
                            className="h-8 w-28"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={s.oraInizio}
                            onChange={(e) => updateSessione(index, { ...s, oraInizio: e.target.value })}
                            placeholder="HH:MM"
                            className="h-8 w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={s.oraFine}
                            onChange={(e) => updateSessione(index, { ...s, oraFine: e.target.value })}
                            placeholder="HH:MM"
                            className="h-8 w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={s.argomento || ''}
                            onChange={(e) => updateSessione(index, { ...s, argomento: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeSessione(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {courseData.sessioni.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nessuna lezione. Clicca "Aggiungi" per inserirne una.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Indietro
        </Button>
        <Button onClick={nextStep} className="gap-2">
          Avanti
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
