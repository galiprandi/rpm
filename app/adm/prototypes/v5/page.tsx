import { getDashboardData } from '@/lib/services/dashboardService';
import { ReadyForDeliveryCard } from '@/components/dashboard/ReadyForDeliveryCard';
import { Header } from '@/components/adm/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Phone, Calendar, Star, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default async function CustomerDashboard() {
  const data = await getDashboardData({ forceMock: true });

  return (
    <div className="space-y-6">
      <Header
        title="Panel de Atención al Cliente"
        description="Foco en la experiencia del cliente y seguimiento de entregas"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 desde ayer</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas para Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">3 ingresos pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfacción Promedio</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.9 / 5.0</div>
            <p className="text-xs text-muted-foreground">Basado en 45 reseñas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReadyForDeliveryCard readyForDelivery={data.readyForDelivery} />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-500" />
              Llamadas Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Ricardo Fort', reason: 'Presupuesto pendiente', time: 'hace 2h' },
              { name: 'Susana Gimenez', reason: 'Confirmar turno', time: 'hace 3h' },
              { name: 'Mirtha Legrand', reason: 'Repuesto demorado', time: 'hace 5h' },
            ].map((call) => (
              <div key={call.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{call.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{call.name}</p>
                    <p className="text-xs text-muted-foreground">{call.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-2">{call.time}</p>
                  <Button size="sm" variant="outline">Llamar</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Últimos Comentarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: 'Juan Topo', comment: 'Excelente atención, el auto quedó como nuevo. Muy recomendables.', rating: 5 },
              { name: 'Homero Simpson', comment: 'Demoraron un poco más de lo acordado pero el trabajo fue impecable.', rating: 4 },
            ].map((review) => (
              <div key={review.name} className="p-4 bg-muted/30 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">{review.name}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-sm italic text-muted-foreground">&quot;{review.comment}&quot;</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
