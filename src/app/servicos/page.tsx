import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { services } from "@/lib/data";

export default function ServicosPage() {
  return (
    <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Serviços</h2>
          <p className="text-muted-foreground mt-1">Gerencie os serviços oferecidos pelo seu estabelecimento.</p>
        </div>
        <Button className="mt-4 md:mt-0">
          <Plus className="mr-2" />
          Novo Serviço
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{service.role}</TableCell>
                  <TableCell className="text-right">
                    {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}