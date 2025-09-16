'use client';

import { useState, useEffect } from 'react';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { WorkSchedule } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { daysOfWeek, dayLabels } from '@/lib/constants';


export default function ConfiguracoesPage() {
    const { funcionarios, workSchedules, appSettings, loading } = useData();
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [manualSelectionEnabled, setManualSelectionEnabled] = useState(false);
    const [webhookUrl, setWebhookUrl] = useState('');
    const { toast } = useToast();

    const [currentSchedule, setCurrentSchedule] = useState<WorkSchedule | null>(null);

    useEffect(() => {
        if (appSettings) {
            setManualSelectionEnabled(appSettings.manualSelection);
            setWebhookUrl(appSettings.appointmentWebhookUrl || '');
        }
    }, [appSettings]);


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
                await setDoc(scheduleRef, currentSchedule, { merge: true });
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
    
    const handleManualSelectionToggle = async (checked: boolean) => {
        setManualSelectionEnabled(checked);
        try {
            const settingsRef = doc(db, 'appState', 'settings');
            await setDoc(settingsRef, { manualSelection: checked }, { merge: true });
             toast({
                title: "Sucesso!",
                description: `Seleção manual ${checked ? 'ativada' : 'desativada'}.`,
            });
        } catch (error) {
             console.error("Erro ao salvar configuração: ", error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível salvar a configuração.",
            });
            // Revert optimistic update
            setManualSelectionEnabled(!checked);
        }
    }

    const handleSaveWebhookUrl = async () => {
        try {
            const settingsRef = doc(db, 'appState', 'settings');
            await setDoc(settingsRef, { appointmentWebhookUrl: webhookUrl }, { merge: true });
            toast({
                title: "Sucesso!",
                description: "URL do webhook salva com sucesso.",
            });
        } catch (error) {
            console.error("Erro ao salvar URL do webhook: ", error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível salvar a URL do webhook.",
            });
        }
    };


    if (loading) {
        return (
            <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
                <Skeleton className="h-9 w-64 mb-8" />
                <div className="space-y-8">
                    <Skeleton className="h-48 w-full" />
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
                        <CardTitle>Seleção Manual de Funcionários</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium">Ativar Seleção Manual</h4>
                                <p className="text-sm text-muted-foreground">
                                    Permite que o sistema ignore a atribuição automática e exija a seleção manual de um profissional.
                                </p>
                            </div>
                            <Switch
                                checked={manualSelectionEnabled}
                                onCheckedChange={handleManualSelectionToggle}
                                aria-label="Ativar seleção manual de funcionários"
                            />
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Webhook de Lembrete de Agendamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                             <p className="text-sm text-muted-foreground mb-2">
                                Forneça a URL para a qual os lembretes de agendamento do dia seguinte serão enviados (via POST).
                                Configure um serviço de cron job externo para chamar <code>/api/appointments/trigger-reminders</code> diariamente.
                            </p>
                            <Label htmlFor="webhook-url">URL do Webhook</Label>
                            <div className="flex gap-2">
                                <Input 
                                    id="webhook-url" 
                                    placeholder="https://seu-servico.com/webhook"
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                />
                                <Button onClick={handleSaveWebhookUrl}>Salvar</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
