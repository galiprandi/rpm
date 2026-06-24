'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/adm/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, CheckCircle, Camera, Clock } from "lucide-react";

export default function WorkOrderDetailLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Header
        title="Cargando..."
        showBackButton
        leftActions={<Skeleton className="w-44 h-9" />}
      >
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 w-64" />
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
             <Skeleton className="h-8 w-48 rounded-full" />
             <Skeleton className="h-8 w-64 rounded-full" />
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4">
             <Skeleton className="h-7 w-32 rounded-md" />
             <Skeleton className="h-7 w-32 rounded-md" />
             <Skeleton className="h-7 w-32 rounded-md" />
          </div>
        </div>
      </Header>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-48" />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
          <div className="flex justify-end pt-4">
             <div className="space-y-2 text-right">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-48" />
             </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <Skeleton className="h-5 w-24" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="checklists" className="w-full">
        <TabsList variant="line" className="w-full justify-start border-b bg-transparent p-0 h-10">
          <TabsTrigger value="checklists" className="flex items-center gap-2 px-4 py-2">
            <CheckCircle className="h-4 w-4" />
            Checklists
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-2 px-4 py-2">
            <Camera className="h-4 w-4" />
            Fotos
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2 px-4 py-2">
            <Clock className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>
        <div className="pt-4">
           <div className="grid md:grid-cols-2 gap-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
           </div>
        </div>
      </Tabs>
    </div>
  );
}
