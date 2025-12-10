import * as React from 'react';
import { Input } from '@/components/ui/input';
import { maskDate, maskCPF, maskPhone, maskCurrency } from '@/lib/formatters';

export type MaskType = 'date' | 'cpf' | 'phone' | 'currency';

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  maskType: MaskType;
  value: string;
  onChange: (maskedValue: string) => void;
}

const maskFunctions: Record<MaskType, (value: string) => string> = {
  date: maskDate,
  cpf: maskCPF,
  phone: maskPhone,
  currency: maskCurrency,
};

const placeholders: Record<MaskType, string> = {
  date: 'dd/mm/aaaa',
  cpf: '000.000.000-00',
  phone: '(00) 00000-0000',
  currency: '0,00',
};

export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ maskType, value, onChange, placeholder, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const maskedValue = maskFunctions[maskType](rawValue);
      onChange(maskedValue);
    };

    return (
      <Input
        ref={ref}
        value={value}
        onChange={handleChange}
        placeholder={placeholder || placeholders[maskType]}
        className={className}
        {...props}
      />
    );
  }
);

MaskedInput.displayName = 'MaskedInput';
