// Core widget types
export interface WidgetConfig {
  apiKey: string;
  endpoint?: string;
  contentstack?: ContentstackConfig;
  theme?: WidgetTheme;
  branding?: WidgetBranding;
  websiteContext?: WebsiteContext;
  position?: WidgetPosition;
  autoDetect?: boolean;
  enableAnalytics?: boolean;
  enableSounds?: boolean;
}

export interface ContentstackConfig {
  apiKey: string;
  deliveryToken: string;
  environment?: string;
  region?: string;
}

export interface WidgetTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  fontFamily?: string;
  fontSize?: string;
  position?: WidgetPosition;
}

export interface WidgetBranding {
  logo?: string;
  name?: string;
  subtitle?: string;
  colors?: {
    primary: string;
    secondary: string;
    accent?: string;
  };
}

export interface WebsiteContext {
  domain: string;
  businessType: string;
  contentTypes?: string[];
  language?: string;
  timezone?: string;
  customData?: Record<string, any>;
}

export type WidgetPosition = 
  | 'bottom-right' 
  | 'bottom-left' 
  | 'top-right' 
  | 'top-left'
  | 'center';

// Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ChatResponse {
  id: string;
  content: string;
  timestamp: string;
  sources?: ContentSource[];
  confidence?: number;
}

export interface ContentSource {
  type: string;
  title: string;
  url?: string;
  snippet?: string;
}

// Event types
export interface WidgetEvents {
  onMount?: () => void;
  onUnmount?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  onMessageSent?: (message: ChatMessage) => void;
  onMessageReceived?: (response: ChatResponse) => void;
  onError?: (error: Error) => void;
}

// API types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface StreamChunk {
  type: 'content' | 'tool_result' | 'tool_error' | 'completion' | 'error';
  content?: string;
  tool_call_id?: string;
  finish_reason?: string;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Widget state
export interface WidgetState {
  isOpen: boolean;
  isLoading: boolean;
  isConnected: boolean;
  messages: ChatMessage[];
  currentInput: string;
  error: string | null;
}

// Plugin system
export interface WidgetPlugin {
  name: string;
  version: string;
  initialize: (widget: UniversalChatWidget) => void;
  destroy?: () => void;
}

// Analytics
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId: string;
}

// Advanced configuration
export interface AdvancedConfig {
  maxMessages?: number;
  timeout?: number;
  retryAttempts?: number;
  enableTypingIndicator?: boolean;
  enableReadReceipts?: boolean;
  enableOfflineMode?: boolean;
  customCSS?: string;
  plugins?: WidgetPlugin[];
}

// Complete widget configuration combining all options
export interface CompleteWidgetConfig extends WidgetConfig, WidgetEvents, AdvancedConfig {}

// Error types
export class WidgetError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WidgetError';
  }
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type EventHandler<T = any> = (event: T) => void;

// DOM types
export interface DOMElements {
  container: HTMLElement;
  trigger: HTMLElement;
  chatWindow: HTMLElement;
  messageList: HTMLElement;
  inputArea: HTMLElement;
  header: HTMLElement;
  footer: HTMLElement;
}

// Animation types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

// Responsive design
export interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
}

// Internationalization
export interface I18nConfig {
  locale: string;
  messages: Record<string, string>;
  fallbackLocale?: string;
}

// Main widget class interface
export interface IUniversalChatWidget {
  config: WidgetConfig;
  state: WidgetState;
  
  mount(selector: string, customConfig?: Partial<WidgetConfig>): Promise<void>;
  unmount(): void;
  open(): void;
  close(): void;
  toggle(): void;
  sendMessage(message: string): Promise<void>;
  updateConfig(newConfig: Partial<WidgetConfig>): void;
  getMessages(): ChatMessage[];
  clearMessages(): void;
  destroy(): void;
}

// Global window interface for browser usage
declare global {
  interface Window {
    TechSurfChat: {
      UniversalChatWidget: typeof UniversalChatWidget;
      init: (config: WidgetConfig) => UniversalChatWidget;
      version: string;
    };
  }
}

// Re-export main class
export { UniversalChatWidget } from './UniversalChatWidget';