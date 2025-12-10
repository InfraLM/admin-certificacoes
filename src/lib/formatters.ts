// Utility functions for formatting data

export function formatCurrency(value: string | number): string {
  let numValue: number;

  if (typeof value === 'string') {
    if (value.includes(',')) {
      // BR Format with comma (e.g. 1.234,56): Remove dots, replace comma with dot
      const cleaned = value.replace(/\./g, '').replace(',', '.');
      numValue = parseFloat(cleaned);
    } else {
      // US Format or simple number (e.g. 1234.56 or 1000 or 3434.25): Parse directly
      // This handles cases where calculated values (no comma) are passed back
      numValue = parseFloat(value);
    }
  } else {
    numValue = value;
  }

  if (isNaN(numValue)) return 'R$ 0,00';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

export function parseCurrency(formatted: string): string {
  // Remove currency symbol, spaces and dots (thousands separators), replace comma with dot
  // More robust: remove everything that is NOT a digit or a comma
  const cleaned = formatted.replace(/[^\d,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? '0.00' : num.toFixed(2);
}

export function formatDate(dateStr: string): string {
  // Already in dd/mm/yyyy format, just return
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  // Convert from yyyy-mm-dd to dd/mm/yyyy
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

export function parseDate(dateStr: string): string {
  // Convert from dd/mm/yyyy to yyyy-mm-dd for date inputs
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

export function dateToISO(dateStr: string): string {
  // Convert dd/mm/yyyy to ISO format for sorting/comparison
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

export function isoToDate(isoStr: string): string {
  // Convert yyyy-mm-dd back to dd/mm/yyyy for display
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) {
    const [year, month, day] = isoStr.split('-');
    return `${day}/${month}/${year}`;
  }
  return isoStr;
}

export function calculateTotal(quantidade: string | number, valorUnitario: string | number): string {
  const qty = typeof quantidade === 'string' ? parseFloat(quantidade) : quantidade;

  // Clean string: remove dots (thousands), replace comma with dot
  const unit = typeof valorUnitario === 'string'
    ? parseFloat(valorUnitario.replace(/\./g, '').replace(',', '.'))
    : valorUnitario;

  if (isNaN(qty) || isNaN(unit)) return '0.00';

  return (qty * unit).toFixed(2);
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
  return cpf;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// ===================
// MASK FUNCTIONS (for real-time input formatting)
// ===================

// Formats date while typing: 01012024 → 01/01/2024
export function maskDate(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 8);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
}

// Formats CPF while typing: 03526642150 → 035.266.421-50
export function maskCPF(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

// Formats phone while typing: 62999056440 → (62) 99905-6440
export function maskPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 2) return `(${cleaned}`;
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
}

// Formats currency while typing: 398756 → 3.987,56
export function maskCurrency(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (!cleaned) return '';
  const numValue = parseInt(cleaned) / 100;
  return numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Converts masked currency back to number string for storage: 3.987,56 → 3987.56
export function unmaskCurrency(value: string): string {
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? '0.00' : num.toFixed(2);
}
