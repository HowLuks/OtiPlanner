'use client';

import { useState } from 'react';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { WorkSchedule } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

const daysOfWeek = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
const dayLabels: { [key: string]: string } = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado',
  domingo: 'Domingo',
};


export default function ConfiguracoesPage() {
    const { funcionarios, workSchedules, loading } = useData();
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const { toast } = useToast();

    const [currentSchedule, setCurrentSchedule] = useState<WorkSchedule | null>(null);

    const handleStaffChange = (staffId: string) => {
        setSelectedStaffId(staffId);
        const schedule = workSchedules.find(ws => ws.staffId === staffId);
        if (schedule) {
            setCurrentSchedule(schedule);
        } else {
            const newSchedule: WorkSchedule = {
                id: `ws-${staffId}`,
                staffId: staffId,
                horarios: {
                    segunda: { start: '09:00', end: '18:00' },
                    terca: { start: '09:00', end: '18:00' },
                    quarta: { start: '09:00', end: '18:00' },
                    quinta: { start: '09:00', end: '18:00' },
                    sexta: { start: '09:00', end: '18:00' },
                    sabado: { start: '09:00', end: '14:00' },
                    domingo: { start: '', end: '' },
                }
            };
            setCurrentSchedule(newSchedule);
        }
    };

    const handleTimeChange = (day: string, type: 'start' | 'end', value: string) => {
        if (currentSchedule) {
            setCurrentSchedule({
                ...currentSchedule,
                horarios: {
                    ...currentSchedule.horarios,
                    [day]: {
                        ...currentSchedule.horarios[day as keyof typeof currentSchedule.horarios],
                        [type]: value,
                    }
                }
            });
        }
    };

    const handleSaveSchedule = async () => {
        if (currentSchedule) {
            try {
                const scheduleRef = doc(db, 'workSchedules', currentSchedule.id);
                await setDoc(scheduleRef, currentSchedule);
                toast({
                    title: "Sucesso!",
                    description: "Horário de trabalho salvo com sucesso.",
                });
            } catch (error) {
                console.error("Erro ao salvar horário: ", error);
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Não foi possível salvar o horário.",
                });
            }
        }
    };

    if (loading) {
        return (
            <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
                <Skeleton className="h-9 w-64 mb-8" />
                <div className="space-y-8">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </main>
        );
    }
    
    const staffOptions = funcionarios.map(f => ({ value: f.id, label: f.name }));

    return (
        <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Configurações</h1>

            <div className="grid gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Definir Horários de Trabalho</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="max-w-md">
                             <Label htmlFor="staff-selector">Selecione o Funcionário</Label>
                             <Combobox
                                options={staffOptions}
                                value={selectedStaffId}
                                onChange={handleStaffChange}
                                placeholder="Selecione um funcionário"
                                searchPlaceholder="Buscar funcionário..."
                                emptyText="Nenhum funcionário encontrado."
                            />
                        </div>

                       {currentSchedule && (
                            <div className="space-y-4 pt-4 border-t">
                                {daysOfWeek.map(day => (
                                    <div key={day} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                        <Label className="md:text-right">{dayLabels[day]}</Label>
                                        <div className="col-span-2 grid grid-cols-2 gap-4">
                                            <Input
                                                type="time"
                                                value={currentSchedule.horarios[day as keyof typeof currentSchedule.horarios]?.start || ''}
                                                onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                                            />
                                            <Input
                                                type="time"
                                                value={currentSchedule.horarios[day as keyof typeof currentSchedule.horarios]?.end || ''}
                                                onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div className="flex justify-end pt-4">
                                    <Button onClick={handleSaveSchedule}>Salvar Horários</Button>
                                </div>
                            </div>
                       )}
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Marcadores</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Área para configurações futuras de marcadores.</p>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Seleção Manual de Funcionários</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Área para configurações futuras de seleção manual.</p>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
