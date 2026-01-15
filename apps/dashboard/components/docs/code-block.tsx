'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  children: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ children, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('relative group', className)}>
      <pre className="bg-white/[0.02] border border-white/10 p-4 rounded-lg text-xs text-white/70 overflow-x-auto">
        {language && (
          <div className="absolute top-2 left-3 text-[10px] uppercase tracking-wider text-white/30 font-medium">
            {language}
          </div>
        )}
        <code className={language ? 'block pt-4' : ''}>{children}</code>
      </pre>
      <button
        onClick={handleCopy}
        className={cn(
          'absolute top-2 right-2 p-2 rounded-md transition-all',
          'opacity-0 group-hover:opacity-100',
          'bg-white/5 hover:bg-white/10 border border-white/10',
          copied && 'opacity-100 bg-emerald-500/20 border-emerald-500/30'
        )}
        title={copied ? 'Copied!' : 'Copy to clipboard'}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-white/50" />
        )}
      </button>
    </div>
  );
}
