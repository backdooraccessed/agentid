'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProfileField } from '@agentid/shared';

interface ProfileFieldsProps {
  fields: ProfileField[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function ProfileFields({ fields, values, onChange }: ProfileFieldsProps) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <FieldRenderer
          key={field.key}
          field={field}
          value={values[field.key]}
          onChange={(value) => onChange(field.key, value)}
        />
      ))}
    </div>
  );
}

interface FieldRendererProps {
  field: ProfileField;
  value: unknown;
  onChange: (value: unknown) => void;
}

function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  switch (field.type) {
    case 'text':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </Label>
          <Input
            id={field.key}
            type="text"
            placeholder={field.placeholder}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className="bg-white/[0.02] border-white/10 focus:border-white/30"
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      );

    case 'number':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </Label>
          <Input
            id={field.key}
            type="number"
            placeholder={field.placeholder}
            value={(value as number) ?? ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
            className="bg-white/[0.02] border-white/10 focus:border-white/30"
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      );

    case 'url':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </Label>
          <Input
            id={field.key}
            type="url"
            placeholder={field.placeholder}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className="bg-white/[0.02] border-white/10 focus:border-white/30"
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </Label>
          <Textarea
            id={field.key}
            placeholder={field.placeholder}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            rows={3}
            className="bg-white/[0.02] border-white/10 focus:border-white/30 resize-none"
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </Label>
          <Select
            value={(value as string) || ''}
            onValueChange={(val) => onChange(val)}
          >
            <SelectTrigger className="bg-white/[0.02] border-white/10">
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      );

    case 'multiselect':
      return (
        <MultiSelectField field={field} value={value} onChange={onChange} />
      );

    case 'toggle':
      return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/10">
          <div className="space-y-0.5">
            <Label htmlFor={field.key} className="text-sm font-medium cursor-pointer">
              {field.label}
            </Label>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
          <Switch
            id={field.key}
            checked={(value as boolean) ?? (field.defaultValue as boolean) ?? false}
            onCheckedChange={(checked) => onChange(checked)}
          />
        </div>
      );

    default:
      return null;
  }
}

interface MultiSelectFieldProps {
  field: ProfileField;
  value: unknown;
  onChange: (value: unknown) => void;
}

function MultiSelectField({ field, value, onChange }: MultiSelectFieldProps) {
  const selectedValues = (value as string[]) || [];

  const toggleOption = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      <div className="flex flex-wrap gap-2">
        {field.options?.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                isSelected
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              )}
            >
              {isSelected && <Check className="h-3.5 w-3.5" />}
              {option.label}
            </button>
          );
        })}
      </div>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
    </div>
  );
}

interface CustomMetadataProps {
  metadata: Record<string, string>;
  onChange: (metadata: Record<string, string>) => void;
}

export function CustomMetadata({ metadata, onChange }: CustomMetadataProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const addMetadata = () => {
    if (newKey.trim() && newValue.trim()) {
      onChange({ ...metadata, [newKey.trim()]: newValue.trim() });
      setNewKey('');
      setNewValue('');
    }
  };

  const removeMetadata = (key: string) => {
    const updated = { ...metadata };
    delete updated[key];
    onChange(updated);
  };

  const entries = Object.entries(metadata);

  return (
    <div className="space-y-4">
      {/* Existing metadata */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map(([key, val]) => (
            <div
              key={key}
              className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/10"
            >
              <Badge variant="outline" className="font-mono text-xs">
                {key}
              </Badge>
              <span className="flex-1 text-sm truncate">{val}</span>
              <button
                type="button"
                onClick={() => removeMetadata(key)}
                className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new metadata */}
      <div className="flex gap-2">
        <Input
          placeholder="Key"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="flex-1 bg-white/[0.02] border-white/10 focus:border-white/30"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addMetadata();
            }
          }}
        />
        <Input
          placeholder="Value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="flex-1 bg-white/[0.02] border-white/10 focus:border-white/30"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addMetadata();
            }
          }}
        />
        <button
          type="button"
          onClick={addMetadata}
          disabled={!newKey.trim() || !newValue.trim()}
          className="px-3 py-2 rounded-lg bg-white/5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Add custom key-value pairs for deployment details, versioning, or any other metadata
      </p>
    </div>
  );
}
