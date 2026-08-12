import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateBR(dateStringOrDate: string | Date | null | undefined): string {
  if (!dateStringOrDate) return '-';
  const date = typeof dateStringOrDate === 'string' ? new Date(dateStringOrDate) : dateStringOrDate;
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDocument(doc: string | null | undefined): string {
  if (!doc) return '';
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  if (clean.length === 11) {
    // CPF: 000.000.000-00
    return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  return doc;
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (clean.length === 10) {
    return clean.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return phone;
}

export function formatCEP(cep: string | null | undefined): string {
  if (!cep) return '';
  const clean = cep.replace(/\D/g, '');
  if (clean.length === 8) {
    return clean.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  }
  return cep;
}

export const BILLING_TYPE_LABELS: Record<string, string> = {
  MONTHLY_ARREARS: 'Mensal Vencido',
  MONTHLY_ADVANCE: 'Mensal Antecipado',
  ONE_TIME: 'Pagamento Único',
  PROJECT_50_50: '50% Início / 50% Entrega',
  SETUP_PLUS_MONTHLY: 'Setup + Mensalidade',
  CUSTOM: 'Personalizado',
};

export const CONTRACT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  READY: { label: 'Pronto', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  FINALIZED: { label: 'Finalizado', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  CANCELLED: { label: 'Cancelado', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};
