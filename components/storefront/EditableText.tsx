'use client';

import React, { ElementType } from 'react';
import { useStorefrontContent } from '@/app/context/StorefrontContentContext';
import { cn } from '@/lib/utils';

interface EditableTextProps {
  as?: ElementType;
  fieldPath: string;
  value: string;
  className?: string;
  children?: React.ReactNode;
  multiline?: boolean;
}

export function EditableText({
  as: Component = 'span',
  fieldPath,
  value,
  className,
  children,
}: EditableTextProps) {
  const { isEditing, updateField } = useStorefrontContent();

  if (!isEditing) {
    return <Component className={className}>{value || children}</Component>;
  }

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const newText = e.currentTarget.innerText.trim();
    if (newText !== value) {
      updateField(fieldPath, newText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    // If Enter pressed without shift on single line elements, blur to commit
    if (e.key === 'Enter' && !e.shiftKey && (Component === 'h1' || Component === 'h2' || Component === 'h3' || Component === 'span')) {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <Component
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={cn(
        className,
        'cursor-text transition-all duration-150 rounded px-1 -mx-1 select-text',
        'hover:outline-dashed hover:outline-1 hover:outline-[#D4AF5A] hover:bg-[#D4AF5A]/10',
        'focus:outline-solid focus:outline-2 focus:outline-[#E9D08A] focus:bg-[#2E0A0F]/90 focus:shadow-[0_0_15px_rgba(233,208,138,0.5)] focus:z-10'
      )}
      title="Click directly to edit this text"
    >
      {value || children}
    </Component>
  );
}
