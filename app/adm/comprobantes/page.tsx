import { redirect } from 'next/navigation';

export default function ComprobantesPage() {
  // Por ahora, redirigir a la vista de Notas de Crédito
  // En el futuro, esta página tendrá tabs para Facturas, NC, y otros comprobantes
  redirect('/adm/credit-notes');
}
