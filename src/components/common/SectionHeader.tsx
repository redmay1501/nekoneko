import Link from 'next/link';
import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  linkHref?: string;
  linkLabel?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, linkHref, linkLabel, action, className }: SectionHeaderProps) {
  return (
    <div className={`sec-h ${className ?? ''}`}>
      <h2>{title}</h2>
      {linkHref && linkLabel ? (
        <Link className="link" href={linkHref}>
          {linkLabel}
        </Link>
      ) : (
        action
      )}
    </div>
  );
}
