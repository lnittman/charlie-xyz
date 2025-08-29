'use client';

import type { ComponentProps } from 'react';
import { Button } from '../button';
import { cn } from '../../lib/utils';

export type AISuggestionsProps = ComponentProps<'div'>;

export const AISuggestions = ({
  className,
  children,
  ...props
}: AISuggestionsProps) => (
  <div className="w-full overflow-x-auto">
    <div className={cn('flex w-max flex-nowrap items-center gap-2', className)} {...props}>
      {children}
    </div>
  </div>
);

export type AISuggestionProps = Omit<
  ComponentProps<typeof Button>,
  'onClick'
> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
};

export const AISuggestion = ({
  suggestion,
  onClick,
  className,
  variant = 'outline',
  size = 'sm',
  children,
  ...props
}: AISuggestionProps) => {
  const handleClick = () => {
    onClick?.(suggestion);
  };

  return (
    <Button
      className={cn('cursor-pointer rounded-full px-4 whitespace-nowrap', className)}
      onClick={handleClick}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {children || suggestion}
    </Button>
  );
};