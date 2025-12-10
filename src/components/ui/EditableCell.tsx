import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { MaskedInput, MaskType } from '@/components/ui/MaskedInput';
import { cn } from '@/lib/utils';

interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'currency' | 'date' | 'phone' | 'cpf';
  className?: string;
  placeholder?: string;
}

export function EditableCell({
  value,
  onChange,
  type = 'text',
  className,
  placeholder = 'Clique para editar',
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // inputRef.current.select(); // Select might not work well with masks immediately
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const formatDisplay = (val: string) => {
    if (!val) return '';
    if (type === 'currency') {
      // If it's already formatted with R$, return it, otherwise format it
      if (val.includes('R$')) return val;

      const num = parseFloat(val.replace(',', '.'));
      if (!isNaN(num)) {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(num);
      }
    }
    return val;
  };

  if (isEditing) {
    const isMasked = ['date', 'currency', 'cpf', 'phone'].includes(type);

    if (isMasked) {
      return (
        <MaskedInput
          ref={inputRef}
          maskType={type as MaskType}
          value={editValue}
          onChange={(val) => setEditValue(val)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={cn('h-8 px-2 text-sm', className)}
          placeholder={placeholder}
        />
      );
    }

    return (
      <Input
        ref={inputRef}
        type={type === 'number' ? 'number' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn('h-8 px-2 text-sm', className)}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        'editable-cell min-h-[32px] flex items-center',
        !value && 'text-muted-foreground italic',
        className
      )}
    >
      {formatDisplay(value) || placeholder}
    </div>
  );
}
