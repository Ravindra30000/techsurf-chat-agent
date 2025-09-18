import {
  WidgetConfig,
  WidgetState,
  ChatMessage,
  ChatResponse,
  IUniversalChatWidget,
  WidgetError,
  DOMElements,
  StreamChunk
} from './types';

export class UniversalChatWidget implements IUniversalChatWidget {
  public config: WidgetConfig;
  public state: WidgetState;
  private elements: Partial<DOMElements> = {};
  private isInitialized = false;
  private sessionId: string;
  private abortController?: AbortController;

  constructor(config: WidgetConfig) {
    this.config = this.mergeConfig(config);
    this.sessionId = this.generateSessionId();
    
    this.state = {
      isOpen: false,
      isLoading: false,
      isConnected: false,
      messages: [],
      currentInput: '',
      error: null,
    };

    console.log('🚀 TechSurf Universal Chat Widget initialized');
    this.trackEvent('widget_initialized');
  }

  private mergeConfig(config: WidgetConfig): WidgetConfig {
    const defaultConfig: Partial<WidgetConfig> = {
      endpoint: 'https://api.techsurf.ai',
      position: 'bottom-right',
      theme: {
        primaryColor: '#007bff',
        backgroundColor: '#ffffff',
        textColor: '#333333',
        borderRadius: 12,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
      },
      autoDetect: true,
      enableAnalytics: true,
      enableSounds: false,
    };

    return { ...defaultConfig, ...config };
  }

  public async mount(selector: string, customConfig?: Partial<WidgetConfig>): Promise<void> {
    try {
      if (this.isInitialized) {
        console.warn('⚠️ Widget already initialized');
        return;
      }

      // Update config if provided
      if (customConfig) {
        this.config = { ...this.config, ...customConfig };
      }

      // Auto-detect Contentstack configuration if enabled
      if (this.config.autoDetect && !this.config.contentstack) {
        this.config.contentstack = this.autoDetectContentstack();
      }

      // Find mount target
      const mountTarget = typeof selector === 'string' 
        ? document.querySelector(selector) 
        : selector;

      if (!mountTarget) {
        throw new WidgetError('Mount target not found', 'MOUNT_ERROR');
      }

      // Create widget elements
      this.createWidgetElements(mountTarget as HTMLElement);
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Apply styles
      this.applyStyles();
      
      // Initialize connection
      await this.initializeConnection();
      
      this.isInitialized = true;
      this.state.isConnected = true;
      
      console.log('✅ Widget mounted successfully');
      this.trackEvent('widget_mounted');
      
      // Call onMount callback
      if (this.config.onMount) {
        this.config.onMount();
      }
      
    } catch (error) {
      console.error('❌ Failed to mount widget:', error);
      this.state.error = error instanceof Error ? error.message : 'Failed to mount widget';
      
      if (this.config.onError) {
        this.config.onError(error instanceof Error ? error : new Error('Mount failed'));
      }
      
      throw error;
    }
  }

  public unmount(): void {
    try {
      // Remove event listeners
      this.removeEventListeners();
      
      // Remove DOM elements
      if (this.elements.container) {
        this.elements.container.remove();
      }
      
      // Cancel ongoing requests
      if (this.abortController) {
        this.abortController.abort();
      }
      
      // Reset state
      this.isInitialized = false;
      this.state.isConnected = false;
      this.elements = {};
      
      console.log('✅ Widget unmounted');
      this.trackEvent('widget_unmounted');
      
      if (this.config.onUnmount) {
        this.config.onUnmount();
      }
      
    } catch (error) {
      console.error('❌ Error during unmount:', error);
    }
  }

  public open(): void {
    if (!this.isInitialized) {
      console.warn('⚠️ Widget not initialized');
      return;
    }

    this.state.isOpen = true;
    this.elements.chatWindow?.classList.add('open');
    this.elements.trigger?.classList.add('hidden');
    
    // Focus on input
    const input = this.elements.inputArea?.querySelector('input') as HTMLInputElement;
    if (input) {
      setTimeout(() => input.focus(), 100);
    }
    
    this.trackEvent('widget_opened');
    
    if (this.config.onOpen) {
      this.config.onOpen();
    }
  }

  public close(): void {
    this.state.isOpen = false;
    this.elements.chatWindow?.classList.remove('open');
    this.elements.trigger?.classList.remove('hidden');
    
    this.trackEvent('widget_closed');
    
    if (this.config.onClose) {
      this.config.onClose();
    }
  }

  public toggle(): void {
    if (this.state.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public async sendMessage(message: string): Promise<void> {
    if (!message.trim()) return;
    
    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };
    
    this.addMessage(userMessage);
    this.state.currentInput = '';
    this.state.isLoading = true;
    
    // Update UI
    this.updateInput('');
    this.showTypingIndicator();
    
    try {
      // Send to API
      await this.sendToAPI(userMessage);
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      const errorMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      
      this.addMessage(errorMessage);
      
      if (this.config.onError) {
        this.config.onError(error instanceof Error ? error : new Error('Send failed'));
      }
      
    } finally {
      this.state.isLoading = false;
      this.hideTypingIndicator();
    }
  }

  private async sendToAPI(message: ChatMessage): Promise<void> {
    const websiteContext = this.gatherWebsiteContext();
    
    // Prepare messages for API
    const messages = [...this.state.messages];
    
    const requestBody = {
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      websiteContext,
      provider: 'groq',
      model: 'llama-3.3-70b-versatile'
    };

    // Setup abort controller for cancellation
    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.config.endpoint}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          ...(this.config.contentstack && {
            'x-contentstack-api-key': this.config.contentstack.apiKey,
            'x-contentstack-delivery-token': this.config.contentstack.deliveryToken,
          }),
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      // Handle streaming response
      await this.handleStreamingResponse(response);
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('📦 Request cancelled');
        return;
      }
      throw error;
    }
  }

  private async handleStreamingResponse(response: Response): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let assistantMessage: ChatMessage | null = null;
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              return;
            }
            
            try {
              const chunk: StreamChunk = JSON.parse(data);
              
              if (chunk.type === 'content' && chunk.content) {
                // Create assistant message if it doesn't exist
                if (!assistantMessage) {
                  assistantMessage = {
                    id: this.generateMessageId(),
                    role: 'assistant',
                    content: '',
                    timestamp: new Date().toISOString(),
                  };
                  this.addMessage(assistantMessage);
                }
                
                // Append content
                assistantMessage.content += chunk.content;
                this.updateMessage(assistantMessage);
              }
              
              if (chunk.type === 'completion') {
                // Message complete
                if (assistantMessage && this.config.onMessageReceived) {
                  this.config.onMessageReceived({
                    id: assistantMessage.id,
                    content: assistantMessage.content,
                    timestamp: assistantMessage.timestamp,
                  });
                }
              }
              
              if (chunk.type === 'error') {
                throw new Error(chunk.error || 'Unknown streaming error');
              }
              
            } catch (parseError) {
              console.warn('Failed to parse stream chunk:', data);
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private createWidgetElements(container: HTMLElement): void {
    // Create container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'techsurf-widget';
    widgetContainer.setAttribute('data-version', '1.0.0');
    
    // Create trigger button
    const trigger = document.createElement('button');
    trigger.className = 'techsurf-trigger';
    trigger.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    
    // Create chat window
    const chatWindow = document.createElement('div');
    chatWindow.className = 'techsurf-chat-window';
    chatWindow.innerHTML = `
      <div class="techsurf-header">
        <div class="techsurf-header-content">
          <div class="techsurf-brand">
            ${this.config.branding?.logo ? `<img src="${this.config.branding.logo}" alt="Logo">` : ''}
            <div>
              <div class="techsurf-name">${this.config.branding?.name || 'AI Assistant'}</div>
              <div class="techsurf-status">Online</div>
            </div>
          </div>
          <button class="techsurf-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="techsurf-messages">
        <div class="techsurf-message assistant">
          <div class="techsurf-message-content">
            Hello! I'm your AI assistant. I can help you with questions about our products, services, or anything else. How can I help you today?
          </div>
        </div>
      </div>
      
      <div class="techsurf-input-area">
        <div class="techsurf-input-container">
          <input type="text" placeholder="Type your message..." maxlength="1000">
          <button class="techsurf-send">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9"></polygon>
            </svg>
          </button>
        </div>
        <div class="techsurf-footer">
          Powered by <a href="https://techsurf.ai" target="_blank">TechSurf</a>
        </div>
      </div>
    `;
    
    // Append elements
    widgetContainer.appendChild(chatWindow);
    widgetContainer.appendChild(trigger);
    container.appendChild(widgetContainer);
    
    // Store references
    this.elements = {
      container: widgetContainer,
      trigger,
      chatWindow,
      messageList: chatWindow.querySelector('.techsurf-messages') as HTMLElement,
      inputArea: chatWindow.querySelector('.techsurf-input-area') as HTMLElement,
      header: chatWindow.querySelector('.techsurf-header') as HTMLElement,
      footer: chatWindow.querySelector('.techsurf-footer') as HTMLElement,
    };
  }

  private setupEventListeners(): void {
    // Trigger button
    this.elements.trigger?.addEventListener('click', () => this.open());
    
    // Close button
    this.elements.chatWindow?.querySelector('.techsurf-close')?.addEventListener('click', () => this.close());
    
    // Input handling
    const input = this.elements.inputArea?.querySelector('input') as HTMLInputElement;
    const sendButton = this.elements.inputArea?.querySelector('.techsurf-send') as HTMLButtonElement;
    
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage(input.value);
        }
      });
      
      input.addEventListener('input', (e) => {
        this.state.currentInput = (e.target as HTMLInputElement).value;
      });
    }
    
    if (sendButton) {
      sendButton.addEventListener('click', () => {
        if (input) {
          this.sendMessage(input.value);
        }
      });
    }
    
    // Click outside to close (optional)
    if (this.config.theme?.closeOnClickOutside) {
      document.addEventListener('click', (e) => {
        if (this.state.isOpen && 
            !this.elements.container?.contains(e.target as Node)) {
          this.close();
        }
      });
    }
  }

  private removeEventListeners(): void {
    // Event listeners are automatically removed when elements are removed from DOM
  }

  private applyStyles(): void {
    // Create and inject CSS
    const styleId = 'techsurf-widget-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = this.generateCSS();
      document.head.appendChild(style);
    }
  }

  private generateCSS(): string {
    const theme = this.config.theme!;
    const position = this.config.position!;
    
    // Position styles
    const positionStyles = this.getPositionStyles(position);
    
    return `
      .techsurf-widget {
        position: fixed;
        ${positionStyles}
        z-index: 2147483647;
        font-family: ${theme.fontFamily};
        font-size: ${theme.fontSize};
        color: ${theme.textColor};
        line-height: 1.4;
      }
      
      .techsurf-trigger {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${theme.primaryColor};
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .techsurf-trigger:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      }
      
      .techsurf-trigger.hidden {
        display: none;
      }
      
      .techsurf-chat-window {
        width: 380px;
        height: 600px;
        background: ${theme.backgroundColor};
        border-radius: ${theme.borderRadius}px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        display: none;
        flex-direction: column;
        overflow: hidden;
        margin-bottom: 20px;
      }
      
      .techsurf-chat-window.open {
        display: flex;
        animation: slideUp 0.3s ease-out;
      }
      
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .techsurf-header {
        background: ${theme.primaryColor};
        color: white;
        padding: 16px;
        flex-shrink: 0;
      }
      
      .techsurf-header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .techsurf-brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .techsurf-brand img {
        width: 32px;
        height: 32px;
        border-radius: 50%;
      }
      
      .techsurf-name {
        font-weight: 600;
        font-size: 16px;
      }
      
      .techsurf-status {
        font-size: 12px;
        opacity: 0.8;
      }
      
      .techsurf-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        opacity: 0.8;
        transition: opacity 0.2s ease;
        padding: 4px;
      }
      
      .techsurf-close:hover {
        opacity: 1;
      }
      
      .techsurf-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .techsurf-message {
        display: flex;
        max-width: 80%;
      }
      
      .techsurf-message.user {
        align-self: flex-end;
      }
      
      .techsurf-message.assistant {
        align-self: flex-start;
      }
      
      .techsurf-message-content {
        background: #f1f3f5;
        padding: 12px 16px;
        border-radius: 18px;
        word-wrap: break-word;
        white-space: pre-wrap;
      }
      
      .techsurf-message.user .techsurf-message-content {
        background: ${theme.primaryColor};
        color: white;
      }
      
      .techsurf-typing-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: #f1f3f5;
        border-radius: 18px;
        align-self: flex-start;
        max-width: 80px;
      }
      
      .techsurf-typing-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #999;
        animation: typingDot 1.4s infinite ease-in-out;
      }
      
      .techsurf-typing-dot:nth-child(1) { animation-delay: -0.32s; }
      .techsurf-typing-dot:nth-child(2) { animation-delay: -0.16s; }
      
      @keyframes typingDot {
        0%, 80%, 100% {
          opacity: 0.3;
          transform: scale(0.8);
        }
        40% {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      .techsurf-input-area {
        flex-shrink: 0;
        border-top: 1px solid #e9ecef;
        background: ${theme.backgroundColor};
      }
      
      .techsurf-input-container {
        display: flex;
        padding: 16px;
        gap: 12px;
        align-items: flex-end;
      }
      
      .techsurf-input-container input {
        flex: 1;
        border: 1px solid #e9ecef;
        border-radius: 20px;
        padding: 12px 16px;
        font-size: 14px;
        font-family: inherit;
        outline: none;
        resize: none;
        background: white;
      }
      
      .techsurf-input-container input:focus {
        border-color: ${theme.primaryColor};
      }
      
      .techsurf-send {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: ${theme.primaryColor};
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      
      .techsurf-send:hover {
        background: ${this.darkenColor(theme.primaryColor!, 10)};
      }
      
      .techsurf-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .techsurf-footer {
        text-align: center;
        padding: 8px 16px 16px;
        font-size: 12px;
        color: #999;
      }
      
      .techsurf-footer a {
        color: ${theme.primaryColor};
        text-decoration: none;
      }
      
      @media (max-width: 480px) {
        .techsurf-chat-window {
          width: 100vw;
          height: 100vh;
          border-radius: 0;
          margin: 0;
        }
        
        .techsurf-widget {
          ${position.includes('right') ? 'right: 0;' : 'left: 0;'}
          ${position.includes('bottom') ? 'bottom: 0;' : 'top: 0;'}
        }
      }
    `;
  }

  private getPositionStyles(position: string): string {
    const margin = '20px';
    
    switch (position) {
      case 'bottom-right':
        return `bottom: ${margin}; right: ${margin};`;
      case 'bottom-left':
        return `bottom: ${margin}; left: ${margin};`;
      case 'top-right':
        return `top: ${margin}; right: ${margin};`;
      case 'top-left':
        return `top: ${margin}; left: ${margin};`;
      case 'center':
        return `top: 50%; left: 50%; transform: translate(-50%, -50%);`;
      default:
        return `bottom: ${margin}; right: ${margin};`;
    }
  }

  private darkenColor(color: string, percent: number): string {
    // Simple color darkening utility
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  // Additional methods for message management, context gathering, etc...
  
  private addMessage(message: ChatMessage): void {
    this.state.messages.push(message);
    this.renderMessage(message);
    
    if (this.config.onMessageSent && message.role === 'user') {
      this.config.onMessageSent(message);
    }
  }

  private updateMessage(message: ChatMessage): void {
    const messageElement = this.elements.messageList?.querySelector(`[data-message-id="${message.id}"]`);
    if (messageElement) {
      const contentElement = messageElement.querySelector('.techsurf-message-content');
      if (contentElement) {
        contentElement.textContent = message.content;
      }
    }
  }

  private renderMessage(message: ChatMessage): void {
    if (!this.elements.messageList) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `techsurf-message ${message.role}`;
    messageElement.setAttribute('data-message-id', message.id);
    messageElement.innerHTML = `
      <div class="techsurf-message-content">${message.content}</div>
    `;
    
    this.elements.messageList.appendChild(messageElement);
    this.scrollToBottom();
  }

  private showTypingIndicator(): void {
    if (!this.elements.messageList) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'techsurf-typing-indicator';
    indicator.innerHTML = `
      <div class="techsurf-typing-dot"></div>
      <div class="techsurf-typing-dot"></div>
      <div class="techsurf-typing-dot"></div>
    `;
    
    this.elements.messageList.appendChild(indicator);
    this.scrollToBottom();
  }

  private hideTypingIndicator(): void {
    const indicator = this.elements.messageList?.querySelector('.techsurf-typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  private scrollToBottom(): void {
    if (this.elements.messageList) {
      this.elements.messageList.scrollTop = this.elements.messageList.scrollHeight;
    }
  }

  private updateInput(value: string): void {
    const input = this.elements.inputArea?.querySelector('input') as HTMLInputElement;
    if (input) {
      input.value = value;
    }
  }

  private generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private generateMessageId(): string {
    return 'msg_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private autoDetectContentstack() {
    // Try to auto-detect Contentstack configuration from meta tags
    const apiKey = document.querySelector('meta[name="contentstack-api-key"]')?.getAttribute('content');
    const deliveryToken = document.querySelector('meta[name="contentstack-delivery-token"]')?.getAttribute('content');
    const environment = document.querySelector('meta[name="contentstack-environment"]')?.getAttribute('content');
    const region = document.querySelector('meta[name="contentstack-region"]')?.getAttribute('content');
    
    if (apiKey && deliveryToken) {
      console.log('✅ Auto-detected Contentstack configuration');
      return {
        apiKey,
        deliveryToken,
        environment: environment || 'production',
        region: region || 'us'
      };
    }
    
    return undefined;
  }

  private gatherWebsiteContext() {
    return {
      domain: window.location.hostname,
      url: window.location.href,
      title: document.title,
      userAgent: navigator.userAgent,
      language: navigator.language,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };
  }

  private async initializeConnection(): Promise<void> {
    // Test connection to API
    try {
      const response = await fetch(`${this.config.endpoint}/health`, {
        method: 'GET',
        headers: {
          'x-api-key': this.config.apiKey,
        },
      });
      
      if (response.ok) {
        console.log('✅ Connection to TechSurf API established');
        this.state.isConnected = true;
      } else {
        throw new Error('API health check failed');
      }
    } catch (error) {
      console.warn('⚠️ Could not connect to TechSurf API:', error);
      this.state.isConnected = false;
    }
  }

  private trackEvent(eventType: string, eventData?: any): void {
    if (!this.config.enableAnalytics) return;
    
    const event = {
      type: eventType,
      data: eventData,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      url: window.location.href,
    };
    
    // Send to analytics endpoint (fire and forget)
    fetch(`${this.config.endpoint}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
      },
      body: JSON.stringify(event),
    }).catch(() => {}); // Ignore errors
  }

  // Public API methods
  public updateConfig(newConfig: Partial<WidgetConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.isInitialized) {
      // Reapply styles if theme changed
      if (newConfig.theme) {
        this.applyStyles();
      }
    }
  }

  public getMessages(): ChatMessage[] {
    return [...this.state.messages];
  }

  public clearMessages(): void {
    this.state.messages = [];
    if (this.elements.messageList) {
      this.elements.messageList.innerHTML = '';
    }
  }

  public destroy(): void {
    this.unmount();
    
    // Remove styles
    const styleElement = document.getElementById('techsurf-widget-styles');
    if (styleElement) {
      styleElement.remove();
    }
  }
}

// Export for browser usage
if (typeof window !== 'undefined') {
  (window as any).TechSurfChat = {
    UniversalChatWidget,
    init: (config: WidgetConfig) => {
      const widget = new UniversalChatWidget(config);
      widget.mount('body');
      return widget;
    },
    version: '1.0.0'
  };
}

export default UniversalChatWidget;