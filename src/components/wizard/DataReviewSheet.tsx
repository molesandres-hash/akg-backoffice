import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    BookOpen,
    Users,
    Calendar,
    Building2,
    UserCog,
    Eye,
    FileCheck
} from "lucide-react";
import { useWizardStore } from "@/store/wizardStore";

export function DataReviewSheet() {
    const { courseData, isSingleModule, isFadCourse } = useWizardStore();
    const totalSessions = courseData.moduli.reduce((acc, m) => acc + m.sessioni.length, 0);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary">
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Revisione Rapida</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-primary" />
                        Riepilogo Dati Corso
                    </SheetTitle>
                    <SheetDescription>
                        Controlla velocemente i dati inseriti prima di generare i documenti.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
                    <div className="space-y-6">
                        {/* Corso */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-primary font-medium">
                                <BookOpen className="w-4 h-4" />
                                <h3>Dati Corso</h3>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
                                <div className="grid grid-cols-3 text-muted-foreground">Titolo</div>
                                <div className="font-medium">{courseData.corso.titolo || '-'}</div>
                                <Separator className="my-2" />
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">ID Corso</span>
                                        <span className="font-medium">{courseData.corso.id || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Ore Totali</span>
                                        <span className="font-medium">{courseData.corso.ore_totali || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Tipo</span>
                                        <Badge variant="outline" className="mt-1">{courseData.corso.tipo || '-'}</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ente */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-primary font-medium">
                                <Building2 className="w-4 h-4" />
                                <h3>Ente e Sede</h3>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
                                <div>
                                    <span className="text-muted-foreground block text-xs">Ente Formatore</span>
                                    <span className="font-medium">{courseData.ente.nome || '-'}</span>
                                </div>
                                <Separator className="my-2" />
                                <div>
                                    <span className="text-muted-foreground block text-xs">Sede Svolgimento</span>
                                    <div className="font-medium">{courseData.sede.nome || '-'}</div>
                                    <div className="text-xs text-muted-foreground">{courseData.sede.indirizzo || '-'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Personale */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-primary font-medium">
                                <UserCog className="w-4 h-4" />
                                <h3>Personale</h3>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-3">
                                <div>
                                    <span className="text-muted-foreground block text-xs mb-1">Docente</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                            D
                                        </div>
                                        <div>
                                            <div className="font-medium">{courseData.trainer.nome_completo || '-'}</div>
                                            <div className="text-xs text-muted-foreground">{courseData.trainer.email || '-'}</div>
                                        </div>
                                    </div>
                                </div>
                                {courseData.tutor.nome_completo && (
                                    <div>
                                        <span className="text-muted-foreground block text-xs mb-1">Tutor</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs">
                                                T
                                            </div>
                                            <div>
                                                <div className="font-medium">{courseData.tutor.nome_completo}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Moduli */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-primary font-medium">
                                <Calendar className="w-4 h-4" />
                                <h3>Struttura ({courseData.moduli.length} Moduli, {totalSessions} Sessioni)</h3>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
                                {courseData.moduli.map((mod, idx) => {
                                    const isModFad = mod.sessioni.some(s => s.is_fad);
                                    return (
                                        <div key={idx} className="border-l-2 border-primary/30 pl-3 py-1">
                                            <div className="font-medium text-xs text-muted-foreground mb-1">Modulo {idx + 1}</div>
                                            <div className="font-medium">{mod.titolo || 'Senza titolo'}</div>
                                            <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                                                <span>{mod.ore_totali} ore</span>
                                                <span>•</span>
                                                <span>{mod.sessioni.length} sessioni</span>
                                                {isModFad && <Badge variant="secondary" className="text-[10px] h-4">FAD</Badge>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Partecipanti */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-primary font-medium">
                                <Users className="w-4 h-4" />
                                <h3>Partecipanti ({courseData.partecipanti.length})</h3>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3 text-sm">
                                <div className="flex flex-wrap gap-2">
                                    {courseData.partecipanti.slice(0, 10).map((p, idx) => (
                                        <Badge key={idx} variant="secondary" className="font-normal">
                                            {p.nome} {p.cognome}
                                        </Badge>
                                    ))}
                                    {courseData.partecipanti.length > 10 && (
                                        <Badge variant="outline" className="font-normal">
                                            +{courseData.partecipanti.length - 10} altri
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
