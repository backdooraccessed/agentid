'use client';

import {
  TrendingUp,
  Code,
  Headphones,
  Database,
  Bot,
  Globe,
  Link,
  Paintbrush,
  Search,
  Server,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AGENT_PROFILES, PROFILE_DEFINITIONS, type AgentProfile } from '@agentid/shared';

const PROFILE_ICONS: Record<AgentProfile, LucideIcon> = {
  'trading': TrendingUp,
  'code-assistant': Code,
  'customer-service': Headphones,
  'data-pipeline': Database,
  'autonomous': Bot,
  'browser-automation': Globe,
  'api-integration': Link,
  'content-generation': Paintbrush,
  'research': Search,
  'devops': Server,
  'custom': Settings,
};

const PROFILE_COLORS: Record<AgentProfile, string> = {
  'trading': 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-400/50',
  'code-assistant': 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-400/50',
  'customer-service': 'from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-400/50',
  'data-pipeline': 'from-orange-500/20 to-orange-600/10 border-orange-500/30 hover:border-orange-400/50',
  'autonomous': 'from-red-500/20 to-red-600/10 border-red-500/30 hover:border-red-400/50',
  'browser-automation': 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 hover:border-cyan-400/50',
  'api-integration': 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 hover:border-indigo-400/50',
  'content-generation': 'from-pink-500/20 to-pink-600/10 border-pink-500/30 hover:border-pink-400/50',
  'research': 'from-teal-500/20 to-teal-600/10 border-teal-500/30 hover:border-teal-400/50',
  'devops': 'from-slate-500/20 to-slate-600/10 border-slate-500/30 hover:border-slate-400/50',
  'custom': 'from-gray-500/20 to-gray-600/10 border-gray-500/30 hover:border-gray-400/50',
};

const PROFILE_ICON_COLORS: Record<AgentProfile, string> = {
  'trading': 'text-emerald-400',
  'code-assistant': 'text-blue-400',
  'customer-service': 'text-purple-400',
  'data-pipeline': 'text-orange-400',
  'autonomous': 'text-red-400',
  'browser-automation': 'text-cyan-400',
  'api-integration': 'text-indigo-400',
  'content-generation': 'text-pink-400',
  'research': 'text-teal-400',
  'devops': 'text-slate-400',
  'custom': 'text-gray-400',
};

interface ProfileSelectorProps {
  selected: AgentProfile | null;
  onSelect: (profile: AgentProfile) => void;
}

export function ProfileSelector({ selected, onSelect }: ProfileSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {AGENT_PROFILES.map((profileId) => {
        const profile = PROFILE_DEFINITIONS[profileId];
        const Icon = PROFILE_ICONS[profileId];
        const isSelected = selected === profileId;

        return (
          <button
            key={profileId}
            type="button"
            onClick={() => onSelect(profileId)}
            className={cn(
              'relative p-4 rounded-xl border bg-gradient-to-br transition-all text-left group',
              PROFILE_COLORS[profileId],
              isSelected
                ? 'ring-2 ring-white/30 scale-[1.02]'
                : 'hover:scale-[1.01]'
            )}
          >
            {isSelected && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white" />
            )}
            <div
              className={cn(
                'w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-3',
                isSelected && 'bg-white/20'
              )}
            >
              <Icon className={cn('h-5 w-5', PROFILE_ICON_COLORS[profileId])} />
            </div>
            <div className="font-medium text-sm">{profile.name}</div>
            <p className="text-xs text-white/50 mt-1 line-clamp-2">
              {profile.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

interface ProfileBadgeProps {
  profile: AgentProfile;
  size?: 'sm' | 'md' | 'lg';
}

export function ProfileBadge({ profile, size = 'md' }: ProfileBadgeProps) {
  const profileDef = PROFILE_DEFINITIONS[profile];
  const Icon = PROFILE_ICONS[profile];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        sizeClasses[size],
        `bg-gradient-to-r ${PROFILE_COLORS[profile]}`
      )}
    >
      <Icon className={cn(iconSizes[size], PROFILE_ICON_COLORS[profile])} />
      <span>{profileDef.name}</span>
    </span>
  );
}
