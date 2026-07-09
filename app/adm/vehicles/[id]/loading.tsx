'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/adm/Header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Car, User, ClipboardList, Plus } from 'lucide-react';

export default function VehicleDetailLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6" role="status" aria-busy="true" aria-label="Cargando detalles del vehículo">
      <Header
        title="..."
        description="..."
        showBackButton
        primaryAction={{
          label: "Nueva OT",
          icon: Plus,
          disabled: true
        }}
      >
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
          <div className="h-4 w-px bg-border mx-1" />
          <Skeleton className="h-6 w-32 rounded-md" />
          <Skeleton className="h-6 w-48 rounded-md" />
        </div>
      </Header>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Vehicle Details Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-muted-foreground/20" aria-hidden="true" />
              <Skeleton className="h-6 w-48" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-20 w-full rounded-md" />
          </CardContent>
        </Card>

        {/* Customer Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground/20" aria-hidden="true" />
              <Skeleton className="h-6 w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-9 w-32 rounded-md mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* History Table Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-muted-foreground/20" aria-hidden="true" />
            <Skeleton className="h-6 w-64" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <div className="p-4 border-b bg-muted/30">
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24 ml-auto" />
              </div>
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border-b last:border-0 flex gap-4 items-center">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-md ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
