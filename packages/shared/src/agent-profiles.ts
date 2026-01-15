/**
 * Agent Profiles - Define different agent categories with their specific fields
 */

export const AGENT_PROFILES = [
  'trading',
  'code-assistant',
  'customer-service',
  'data-pipeline',
  'autonomous',
  'browser-automation',
  'api-integration',
  'content-generation',
  'research',
  'devops',
  'custom',
] as const;

export type AgentProfile = (typeof AGENT_PROFILES)[number];

export interface ProfileField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'url' | 'textarea' | 'toggle';
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string | number | boolean | string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ProfileDefinition {
  id: AgentProfile;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  fields: ProfileField[];
  suggestedPermissions: {
    actions: string[];
    domains: string[];
  };
}

export const PROFILE_DEFINITIONS: Record<AgentProfile, ProfileDefinition> = {
  'trading': {
    id: 'trading',
    name: 'Trading Agent',
    description: 'Automated trading bots for crypto, stocks, or forex',
    icon: 'TrendingUp',
    color: 'emerald',
    fields: [
      {
        key: 'exchange',
        label: 'Exchange',
        type: 'select',
        required: true,
        options: [
          { value: 'binance', label: 'Binance' },
          { value: 'coinbase', label: 'Coinbase' },
          { value: 'kraken', label: 'Kraken' },
          { value: 'ftx', label: 'FTX' },
          { value: 'interactive_brokers', label: 'Interactive Brokers' },
          { value: 'alpaca', label: 'Alpaca' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        key: 'trading_pairs',
        label: 'Trading Pairs',
        type: 'text',
        placeholder: 'BTC/USDT, ETH/USDT',
        description: 'Comma-separated list of trading pairs',
      },
      {
        key: 'strategy_type',
        label: 'Strategy Type',
        type: 'select',
        options: [
          { value: 'market_making', label: 'Market Making' },
          { value: 'arbitrage', label: 'Arbitrage' },
          { value: 'trend_following', label: 'Trend Following' },
          { value: 'mean_reversion', label: 'Mean Reversion' },
          { value: 'ml_based', label: 'ML-Based' },
          { value: 'custom', label: 'Custom' },
        ],
      },
      {
        key: 'max_position_size',
        label: 'Max Position Size',
        type: 'number',
        placeholder: '10000',
        description: 'Maximum position size in base currency',
      },
      {
        key: 'risk_limit_percent',
        label: 'Risk Limit (%)',
        type: 'number',
        placeholder: '2',
        description: 'Maximum risk per trade as percentage',
        validation: { min: 0, max: 100 },
      },
      {
        key: 'api_endpoint',
        label: 'API Endpoint',
        type: 'url',
        placeholder: 'https://api.mybot.com',
        description: 'Agent API endpoint for monitoring',
      },
    ],
    suggestedPermissions: {
      actions: ['execute', 'read', 'write'],
      domains: ['financial', 'external_api'],
    },
  },

  'code-assistant': {
    id: 'code-assistant',
    name: 'Code Assistant',
    description: 'AI coding assistants and IDE integrations',
    icon: 'Code',
    color: 'blue',
    fields: [
      {
        key: 'model_provider',
        label: 'Model Provider',
        type: 'select',
        required: true,
        options: [
          { value: 'anthropic', label: 'Anthropic (Claude)' },
          { value: 'openai', label: 'OpenAI (GPT)' },
          { value: 'google', label: 'Google (Gemini)' },
          { value: 'local', label: 'Local Model' },
          { value: 'custom', label: 'Custom/Self-hosted' },
        ],
      },
      {
        key: 'model_name',
        label: 'Model Name',
        type: 'text',
        placeholder: 'claude-3-opus, gpt-4-turbo',
      },
      {
        key: 'supported_languages',
        label: 'Supported Languages',
        type: 'text',
        placeholder: 'Python, TypeScript, Rust',
        description: 'Comma-separated list of programming languages',
      },
      {
        key: 'ide_integration',
        label: 'IDE Integration',
        type: 'multiselect',
        options: [
          { value: 'vscode', label: 'VS Code' },
          { value: 'jetbrains', label: 'JetBrains IDEs' },
          { value: 'neovim', label: 'Neovim' },
          { value: 'emacs', label: 'Emacs' },
          { value: 'cli', label: 'CLI' },
          { value: 'web', label: 'Web-based' },
        ],
      },
      {
        key: 'context_window',
        label: 'Context Window (tokens)',
        type: 'number',
        placeholder: '128000',
      },
      {
        key: 'can_execute_code',
        label: 'Can Execute Code',
        type: 'toggle',
        description: 'Agent can run code in sandboxed environment',
      },
      {
        key: 'can_access_filesystem',
        label: 'Can Access Filesystem',
        type: 'toggle',
        description: 'Agent can read/write local files',
      },
    ],
    suggestedPermissions: {
      actions: ['read', 'write', 'execute'],
      domains: ['internal', 'code'],
    },
  },

  'customer-service': {
    id: 'customer-service',
    name: 'Customer Service',
    description: 'Support chatbots and customer interaction agents',
    icon: 'Headphones',
    color: 'purple',
    fields: [
      {
        key: 'platform',
        label: 'Platform',
        type: 'select',
        options: [
          { value: 'intercom', label: 'Intercom' },
          { value: 'zendesk', label: 'Zendesk' },
          { value: 'freshdesk', label: 'Freshdesk' },
          { value: 'custom', label: 'Custom Integration' },
        ],
      },
      {
        key: 'supported_languages',
        label: 'Supported Languages',
        type: 'text',
        placeholder: 'English, Spanish, French',
        description: 'Human languages the agent can communicate in',
      },
      {
        key: 'escalation_enabled',
        label: 'Human Escalation',
        type: 'toggle',
        description: 'Can escalate to human agents',
        defaultValue: true,
      },
      {
        key: 'sentiment_analysis',
        label: 'Sentiment Analysis',
        type: 'toggle',
        description: 'Analyzes customer sentiment',
      },
      {
        key: 'knowledge_base_url',
        label: 'Knowledge Base URL',
        type: 'url',
        placeholder: 'https://docs.company.com',
      },
      {
        key: 'max_concurrent_chats',
        label: 'Max Concurrent Chats',
        type: 'number',
        placeholder: '100',
      },
    ],
    suggestedPermissions: {
      actions: ['read', 'write'],
      domains: ['user_data', 'internal'],
    },
  },

  'data-pipeline': {
    id: 'data-pipeline',
    name: 'Data Pipeline',
    description: 'ETL, data processing, and analytics agents',
    icon: 'Database',
    color: 'orange',
    fields: [
      {
        key: 'orchestrator',
        label: 'Orchestrator',
        type: 'select',
        options: [
          { value: 'airflow', label: 'Apache Airflow' },
          { value: 'dagster', label: 'Dagster' },
          { value: 'prefect', label: 'Prefect' },
          { value: 'temporal', label: 'Temporal' },
          { value: 'custom', label: 'Custom' },
        ],
      },
      {
        key: 'data_sources',
        label: 'Data Sources',
        type: 'textarea',
        placeholder: 'PostgreSQL, S3, Kafka',
        description: 'List of data sources this agent accesses',
      },
      {
        key: 'data_destinations',
        label: 'Data Destinations',
        type: 'textarea',
        placeholder: 'Snowflake, BigQuery, Redis',
        description: 'List of data destinations',
      },
      {
        key: 'schedule',
        label: 'Schedule',
        type: 'text',
        placeholder: '0 * * * * (hourly)',
        description: 'Cron expression for scheduled runs',
      },
      {
        key: 'max_data_volume_gb',
        label: 'Max Data Volume (GB)',
        type: 'number',
        placeholder: '100',
        description: 'Maximum data volume per run',
      },
    ],
    suggestedPermissions: {
      actions: ['read', 'write', 'delete'],
      domains: ['internal', 'external_api'],
    },
  },

  'autonomous': {
    id: 'autonomous',
    name: 'Autonomous Agent',
    description: 'Self-directed agents with planning and tool use',
    icon: 'Bot',
    color: 'red',
    fields: [
      {
        key: 'framework',
        label: 'Framework',
        type: 'select',
        options: [
          { value: 'langchain', label: 'LangChain' },
          { value: 'autogen', label: 'AutoGen' },
          { value: 'crewai', label: 'CrewAI' },
          { value: 'autogpt', label: 'AutoGPT' },
          { value: 'custom', label: 'Custom Framework' },
        ],
      },
      {
        key: 'planning_model',
        label: 'Planning Model',
        type: 'text',
        placeholder: 'claude-3-opus, gpt-4',
        description: 'Model used for planning and reasoning',
      },
      {
        key: 'tools',
        label: 'Available Tools',
        type: 'textarea',
        placeholder: 'web_search, code_execution, file_operations',
        description: 'List of tools the agent can use',
      },
      {
        key: 'memory_backend',
        label: 'Memory Backend',
        type: 'select',
        options: [
          { value: 'none', label: 'No Persistence' },
          { value: 'redis', label: 'Redis' },
          { value: 'postgres', label: 'PostgreSQL' },
          { value: 'pinecone', label: 'Pinecone' },
          { value: 'chromadb', label: 'ChromaDB' },
          { value: 'custom', label: 'Custom' },
        ],
      },
      {
        key: 'max_iterations',
        label: 'Max Iterations',
        type: 'number',
        placeholder: '10',
        description: 'Maximum planning/execution iterations',
      },
      {
        key: 'human_in_loop',
        label: 'Human-in-the-Loop',
        type: 'toggle',
        description: 'Requires human approval for certain actions',
      },
    ],
    suggestedPermissions: {
      actions: ['read', 'write', 'execute', 'admin'],
      domains: ['internal', 'external_api', 'code'],
    },
  },

  'browser-automation': {
    id: 'browser-automation',
    name: 'Browser Automation',
    description: 'Web scraping, testing, and browser control agents',
    icon: 'Globe',
    color: 'cyan',
    fields: [
      {
        key: 'browser_engine',
        label: 'Browser Engine',
        type: 'select',
        options: [
          { value: 'playwright', label: 'Playwright' },
          { value: 'puppeteer', label: 'Puppeteer' },
          { value: 'selenium', label: 'Selenium' },
          { value: 'browserbase', label: 'Browserbase' },
          { value: 'custom', label: 'Custom' },
        ],
      },
      {
        key: 'allowed_domains',
        label: 'Allowed Domains',
        type: 'textarea',
        placeholder: '*.example.com\n*.trusted-site.com',
        description: 'Domains the agent can access (one per line, wildcards allowed)',
      },
      {
        key: 'can_take_screenshots',
        label: 'Can Take Screenshots',
        type: 'toggle',
        defaultValue: true,
      },
      {
        key: 'can_fill_forms',
        label: 'Can Fill Forms',
        type: 'toggle',
        defaultValue: true,
      },
      {
        key: 'can_click',
        label: 'Can Click Elements',
        type: 'toggle',
        defaultValue: true,
      },
      {
        key: 'headless',
        label: 'Headless Mode',
        type: 'toggle',
        defaultValue: true,
        description: 'Run without visible browser window',
      },
      {
        key: 'max_pages',
        label: 'Max Concurrent Pages',
        type: 'number',
        placeholder: '5',
      },
    ],
    suggestedPermissions: {
      actions: ['read', 'write', 'execute'],
      domains: ['external_api'],
    },
  },

  'api-integration': {
    id: 'api-integration',
    name: 'API Integration',
    description: 'Agents that connect and orchestrate APIs',
    icon: 'Link',
    color: 'indigo',
    fields: [
      {
        key: 'api_endpoints',
        label: 'API Endpoints',
        type: 'textarea',
        placeholder: 'https://api.service1.com\nhttps://api.service2.com',
        description: 'List of API endpoints (one per line)',
      },
      {
        key: 'auth_methods',
        label: 'Authentication Methods',
        type: 'multiselect',
        options: [
          { value: 'api_key', label: 'API Key' },
          { value: 'oauth2', label: 'OAuth 2.0' },
          { value: 'jwt', label: 'JWT' },
          { value: 'basic', label: 'Basic Auth' },
          { value: 'none', label: 'No Auth' },
        ],
      },
      {
        key: 'rate_limit',
        label: 'Rate Limit (req/min)',
        type: 'number',
        placeholder: '60',
      },
      {
        key: 'timeout_ms',
        label: 'Timeout (ms)',
        type: 'number',
        placeholder: '30000',
        defaultValue: 30000,
      },
      {
        key: 'retry_enabled',
        label: 'Auto-Retry',
        type: 'toggle',
        defaultValue: true,
      },
    ],
    suggestedPermissions: {
      actions: ['read', 'write', 'execute'],
      domains: ['external_api'],
    },
  },

  'content-generation': {
    id: 'content-generation',
    name: 'Content Generation',
    description: 'Writing, image, video, and media creation agents',
    icon: 'Paintbrush',
    color: 'pink',
    fields: [
      {
        key: 'content_types',
        label: 'Content Types',
        type: 'multiselect',
        options: [
          { value: 'text', label: 'Text/Articles' },
          { value: 'images', label: 'Images' },
          { value: 'video', label: 'Video' },
          { value: 'audio', label: 'Audio' },
          { value: 'code', label: 'Code' },
        ],
      },
      {
        key: 'model_provider',
        label: 'Model Provider',
        type: 'select',
        options: [
          { value: 'anthropic', label: 'Anthropic' },
          { value: 'openai', label: 'OpenAI' },
          { value: 'stability', label: 'Stability AI' },
          { value: 'midjourney', label: 'Midjourney' },
          { value: 'custom', label: 'Custom' },
        ],
      },
      {
        key: 'output_formats',
        label: 'Output Formats',
        type: 'text',
        placeholder: 'markdown, html, png, mp4',
      },
      {
        key: 'max_output_length',
        label: 'Max Output Length',
        type: 'number',
        placeholder: '10000',
        description: 'Maximum output length in characters/tokens',
      },
      {
        key: 'content_moderation',
        label: 'Content Moderation',
        type: 'toggle',
        defaultValue: true,
        description: 'Filter inappropriate content',
      },
    ],
    suggestedPermissions: {
      actions: ['read', 'write'],
      domains: ['internal'],
    },
  },

  'research': {
    id: 'research',
    name: 'Research Agent',
    description: 'Information gathering and analysis agents',
    icon: 'Search',
    color: 'teal',
    fields: [
      {
        key: 'search_engines',
        label: 'Search Engines',
        type: 'multiselect',
        options: [
          { value: 'google', label: 'Google' },
          { value: 'bing', label: 'Bing' },
          { value: 'perplexity', label: 'Perplexity' },
          { value: 'arxiv', label: 'arXiv' },
          { value: 'semantic_scholar', label: 'Semantic Scholar' },
          { value: 'custom', label: 'Custom' },
        ],
      },
      {
        key: 'data_sources',
        label: 'Data Sources',
        type: 'textarea',
        placeholder: 'Academic papers, news, social media',
      },
      {
        key: 'citation_style',
        label: 'Citation Style',
        type: 'select',
        options: [
          { value: 'apa', label: 'APA' },
          { value: 'mla', label: 'MLA' },
          { value: 'chicago', label: 'Chicago' },
          { value: 'none', label: 'None' },
        ],
      },
      {
        key: 'fact_checking',
        label: 'Fact Checking',
        type: 'toggle',
        defaultValue: true,
      },
      {
        key: 'max_sources',
        label: 'Max Sources per Query',
        type: 'number',
        placeholder: '20',
      },
    ],
    suggestedPermissions: {
      actions: ['read'],
      domains: ['external_api'],
    },
  },

  'devops': {
    id: 'devops',
    name: 'DevOps Agent',
    description: 'Infrastructure, deployment, and monitoring agents',
    icon: 'Server',
    color: 'slate',
    fields: [
      {
        key: 'cloud_providers',
        label: 'Cloud Providers',
        type: 'multiselect',
        options: [
          { value: 'aws', label: 'AWS' },
          { value: 'gcp', label: 'Google Cloud' },
          { value: 'azure', label: 'Azure' },
          { value: 'vercel', label: 'Vercel' },
          { value: 'kubernetes', label: 'Kubernetes' },
        ],
      },
      {
        key: 'infrastructure_tools',
        label: 'Infrastructure Tools',
        type: 'multiselect',
        options: [
          { value: 'terraform', label: 'Terraform' },
          { value: 'pulumi', label: 'Pulumi' },
          { value: 'ansible', label: 'Ansible' },
          { value: 'docker', label: 'Docker' },
          { value: 'helm', label: 'Helm' },
        ],
      },
      {
        key: 'environments',
        label: 'Environments',
        type: 'text',
        placeholder: 'dev, staging, prod',
        description: 'Comma-separated list of environments',
      },
      {
        key: 'can_deploy',
        label: 'Can Deploy',
        type: 'toggle',
        description: 'Can trigger deployments',
      },
      {
        key: 'can_rollback',
        label: 'Can Rollback',
        type: 'toggle',
        description: 'Can rollback deployments',
      },
      {
        key: 'monitoring_webhook',
        label: 'Monitoring Webhook',
        type: 'url',
        placeholder: 'https://alerts.company.com/webhook',
      },
    ],
    suggestedPermissions: {
      actions: ['read', 'write', 'execute', 'admin'],
      domains: ['internal', 'infrastructure'],
    },
  },

  'custom': {
    id: 'custom',
    name: 'Custom Agent',
    description: 'Define your own agent type with custom fields',
    icon: 'Settings',
    color: 'gray',
    fields: [
      {
        key: 'agent_category',
        label: 'Agent Category',
        type: 'text',
        placeholder: 'My Custom Category',
        required: true,
      },
      {
        key: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Describe what this agent does...',
      },
      {
        key: 'deployment_type',
        label: 'Deployment Type',
        type: 'select',
        options: [
          { value: 'cloud', label: 'Cloud' },
          { value: 'on-premise', label: 'On-Premise' },
          { value: 'edge', label: 'Edge' },
          { value: 'hybrid', label: 'Hybrid' },
          { value: 'local', label: 'Local' },
        ],
      },
      {
        key: 'runtime',
        label: 'Runtime',
        type: 'select',
        options: [
          { value: 'python', label: 'Python' },
          { value: 'nodejs', label: 'Node.js' },
          { value: 'go', label: 'Go' },
          { value: 'rust', label: 'Rust' },
          { value: 'container', label: 'Container' },
          { value: 'serverless', label: 'Serverless' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        key: 'api_endpoint',
        label: 'API Endpoint',
        type: 'url',
        placeholder: 'https://api.myagent.com',
      },
      {
        key: 'health_check_url',
        label: 'Health Check URL',
        type: 'url',
        placeholder: 'https://api.myagent.com/health',
      },
      {
        key: 'documentation_url',
        label: 'Documentation URL',
        type: 'url',
        placeholder: 'https://docs.myagent.com',
      },
    ],
    suggestedPermissions: {
      actions: ['read', 'write'],
      domains: ['internal'],
    },
  },
};

export function getProfileDefinition(profile: AgentProfile): ProfileDefinition {
  return PROFILE_DEFINITIONS[profile];
}

export function getProfileIcon(profile: AgentProfile): string {
  return PROFILE_DEFINITIONS[profile].icon;
}

export function getProfileColor(profile: AgentProfile): string {
  return PROFILE_DEFINITIONS[profile].color;
}

/**
 * Maps agent profiles to the legacy agent_type categories.
 * - autonomous: Agents that operate independently with minimal supervision
 * - supervised: Agents that require human oversight or approval
 * - hybrid: Agents that can operate autonomously but with safety rails
 */
const PROFILE_TO_AGENT_TYPE: Record<AgentProfile, 'autonomous' | 'supervised' | 'hybrid'> = {
  'trading': 'autonomous',
  'code-assistant': 'supervised',
  'customer-service': 'supervised',
  'data-pipeline': 'autonomous',
  'autonomous': 'autonomous',
  'browser-automation': 'hybrid',
  'api-integration': 'hybrid',
  'content-generation': 'supervised',
  'research': 'supervised',
  'devops': 'hybrid',
  'custom': 'hybrid',
};

export function getAgentTypeForProfile(profile: AgentProfile): 'autonomous' | 'supervised' | 'hybrid' {
  return PROFILE_TO_AGENT_TYPE[profile];
}
