'use client';

import { useState } from 'react';
import { Check, Copy, Code2, Image, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmbeddableBadgeProps {
  credentialId: string;
  baseUrl?: string;
}

type BadgeStyle = 'modern' | 'flat' | 'flat-square' | 'plastic';
type BadgeFormat = 'svg' | 'html' | 'markdown';

export function EmbeddableBadge({ credentialId, baseUrl = '' }: EmbeddableBadgeProps) {
  const [selectedStyle, setSelectedStyle] = useState<BadgeStyle>('modern');
  const [selectedFormat, setSelectedFormat] = useState<BadgeFormat>('svg');
  const [copied, setCopied] = useState(false);

  const badgeUrl = `${baseUrl}/api/badge/${credentialId}?style=${selectedStyle}`;

  const getEmbedCode = () => {
    switch (selectedFormat) {
      case 'html':
        return `<a href="${baseUrl}/credentials/${credentialId}" target="_blank" rel="noopener">
  <img src="${badgeUrl}" alt="AgentID Verified Badge" />
</a>`;
      case 'markdown':
        return `[![AgentID Verified](${badgeUrl})](${baseUrl}/credentials/${credentialId})`;
      case 'svg':
      default:
        return badgeUrl;
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getEmbedCode());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = getEmbedCode();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const styles: { value: BadgeStyle; label: string }[] = [
    { value: 'modern', label: 'Modern' },
    { value: 'flat', label: 'Flat' },
    { value: 'flat-square', label: 'Square' },
    { value: 'plastic', label: 'Plastic' },
  ];

  const formats: { value: BadgeFormat; label: string; icon: typeof Code2 }[] = [
    { value: 'svg', label: 'URL', icon: Link2 },
    { value: 'html', label: 'HTML', icon: Code2 },
    { value: 'markdown', label: 'Markdown', icon: Image },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Code2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          Embeddable Badge
        </CardTitle>
        <CardDescription>
          Add a verification badge to your website or documentation
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Badge Preview */}
        <div className="flex items-center justify-center p-8 bg-muted/30 rounded-lg border border-dashed">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={badgeUrl}
            alt="AgentID Badge Preview"
            className="max-w-full h-auto"
          />
        </div>

        {/* Style Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Badge Style</label>
          <div className="flex gap-2">
            {styles.map((style) => (
              <button
                key={style.value}
                onClick={() => setSelectedStyle(style.value)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg border transition-all',
                  selectedStyle === style.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        {/* Format Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Embed Format</label>
          <div className="flex gap-2">
            {formats.map((format) => {
              const Icon = format.icon;
              return (
                <button
                  key={format.value}
                  onClick={() => setSelectedFormat(format.value)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-all',
                    selectedFormat === format.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                      : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {format.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Code Display */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Embed Code</label>
          <div className="relative">
            <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 text-sm font-mono overflow-x-auto">
              <code>{getEmbedCode()}</code>
            </pre>
            <Button
              size="sm"
              variant="secondary"
              onClick={copyToClipboard}
              className="absolute top-2 right-2 gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Usage Hints */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>The badge automatically updates to reflect the credential status.</p>
          <p>Add <code className="px-1 py-0.5 bg-muted rounded">?theme=dark</code> for dark mode support.</p>
        </div>
      </CardContent>
    </Card>
  );
}
