import { ChatWidgetConfig, ChatMessage, ChatSession, WidgetTheme, WidgetEvents } from './types.js';

export class UniversalChatWidget {
  private config: ChatWidgetConfig;
  private container: HTMLElement | null = null;
  private isInitialized: boolean = false;
  private isOpen: boolean = false;
  private eventListeners: { [key: string]: Function[] } = {};
  private messages: ChatMessage[] = [];
  private sessionId: string;
  private socket: any = null;
  private isConnected: boolean = false;

  constructor(config: ChatWidgetConfig) {
    this.config = {
      position: 'bottom-right',
      theme: 'light',
      showOnLoad: false,
      enableSounds: true,
      enableTypingIndicator: true,
      maxMessages: 50,
      ...config
    };
    
    this.sessionId = this.generateSessionId();
    this.bindMethods();
  }

  private bindMethods(): void {
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.toggle = this.toggle.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  public async init(): Promise<void> {
    if (this.isInitialized) {
      console.warn('TechSurf Chat Widget is already initialized');
      return;
    }

    try {
      await this.validateConfig();
      await this.loadStyles();
      this.createWidget();
      this.setupEventListeners();
      
      if (this.config.showOnLoad) {
        this.open();
      }

      this.isInitialized = true;
      this.emit('initialized', { sessionId: this.sessionId });
      
      console.log('✅ TechSurf Chat Widget initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize TechSurf Chat Widget:', error);
      throw error;
    }
  }

  private async validateConfig(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('API key is required');
    }

    if (!this.config.tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!this.config.apiUrl) {
      throw new Error('API URL is required');
    }

    // Validate API key format
    if (!this.config.apiKey.startsWith('ts_')) {
      throw new Error('Invalid API key format');
    }

    // Test API connection
    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        headers: {
          'x-api-key': this.config.apiKey,
          'x-tenant-id': this.config.tenantId
        }
      });

      if (!response.ok) {
        throw new Error(`API health check failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('⚠️ API health check failed, widget may not function properly:', error);
    }
  }

  private async loadStyles(): Promise<void> {
    if (document.getElementById('techsurf-chat-styles')) return;

    const style = document.createElement('style');
    style.id = 'techsurf-chat-styles';
    style.textContent = this.getCSS();
    document.head.appendChild(style);
  }

  private getCSS(): string {
    const theme = this.config.theme === 'dark' ? this.getDarkTheme() : this.getLightTheme();
    const position = this.getPositionStyles();

    return `
      .techsurf-chat-widget {
        position: fixed;
        ${position}
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      .techsurf-chat-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark});
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0, 123, 255, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .techsurf-chat-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 123, 255, 0.4);
      }

      .techsurf-chat-button svg {
        width: 24px;
        height: 24px;
        fill: white;
        transition: transform 0.3s ease;
      }

      .techsurf-chat-button.open svg {
        transform: rotate(45deg);
      }

      .techsurf-chat-panel {
        width: 350px;
        height: 500px;
        background: ${theme.background};
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: translateY(20px) scale(0.95);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        margin-bottom: 10px;
      }

      .techsurf-chat-panel.open {
        transform: translateY(0) scale(1);
        opacity: 1;
        visibility: visible;
      }

      .techsurf-chat-header {
        background: linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark});
        color: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: between;
      }

      .techsurf-chat-header-content {
        flex: 1;
      }

      .techsurf-chat-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }

      .techsurf-chat-subtitle {
        font-size: 12px;
        opacity: 0.8;
        margin: 2px 0 0 0;
      }

      .techsurf-chat-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        margin-left: 10px;
        border-radius: 4px;
        opacity: 0.8;
        transition: opacity 0.2s ease;
      }

      .techsurf-chat-close:hover {
        opacity: 1;
      }

      .techsurf-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: ${theme.background};
      }

      .techsurf-chat-message {
        margin-bottom: 16px;
        display: flex;
        align-items: flex-start;
      }

      .techsurf-chat-message.user {
        flex-direction: row-reverse;
      }

      .techsurf-chat-message-content {
        max-width: 80%;
        padding: 12px 16px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.4;
        word-wrap: break-word;
      }

      .techsurf-chat-message.user .techsurf-chat-message-content {
        background: ${theme.primary};
        color: white;
        border-bottom-right-radius: 6px;
      }

      .techsurf-chat-message.assistant .techsurf-chat-message-content {
        background: ${theme.messageBg};
        color: ${theme.text};
        border-bottom-left-radius: 6px;
      }

      .techsurf-chat-message-time {
        font-size: 11px;
        color: ${theme.textSecondary};
        margin-top: 4px;
        margin-left: 12px;
        margin-right: 12px;
      }

      .techsurf-chat-input {
        padding: 16px 20px;
        border-top: 1px solid ${theme.border};
        background: ${theme.background};
      }

      .techsurf-chat-input-container {
        display: flex;
        align-items: flex-end;
        background: ${theme.inputBg};
        border-radius: 25px;
        padding: 8px 12px;
        border: 1px solid ${theme.border};
        transition: border-color 0.2s ease;
      }

      .techsurf-chat-input-container:focus-within {
        border-color: ${theme.primary};
      }

      .techsurf-chat-input-field {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        font-size: 14px;
        color: ${theme.text};
        resize: none;
        max-height: 100px;
        min-height: 20px;
        padding: 6px 8px;
        font-family: inherit;
      }

      .techsurf-chat-send-button {
        background: ${theme.primary};
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 8px;
        transition: all 0.2s ease;
        opacity: 0.7;
      }

      .techsurf-chat-send-button:hover {
        opacity: 1;
        transform: translateY(-1px);
      }

      .techsurf-chat-send-button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        transform: none;
      }

      .techsurf-chat-send-button svg {
        width: 16px;
        height: 16px;
        fill: white;
      }

      .techsurf-chat-typing {
        padding: 8px 16px;
        color: ${theme.textSecondary};
        font-size: 13px;
        font-style: italic;
      }

      .techsurf-chat-typing-dots {
        display: inline-block;
      }

      .techsurf-chat-typing-dots::after {
        content: '';
        animation: techsurf-dots 1.5s infinite;
      }

      @keyframes techsurf-dots {
        0%, 20% { content: '.'; }
        40% { content: '..'; }
        60%, 100% { content: '...'; }
      }

      .techsurf-chat-welcome {
        text-align: center;
        padding: 40px 20px;
        color: ${theme.textSecondary};
      }

      .techsurf-chat-welcome h3 {
        margin: 0 0 8px 0;
        color: ${theme.text};
        font-size: 18px;
      }

      .techsurf-chat-welcome p {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
      }

      .techsurf-chat-powered-by {
        text-align: center;
        padding: 8px;
        font-size: 11px;
        color: ${theme.textSecondary};
        background: ${theme.background};
        border-top: 1px solid ${theme.border};
      }

      .techsurf-chat-powered-by a {
        color: ${theme.primary};
        text-decoration: none;
      }

      @media (max-width: 480px) {
        .techsurf-chat-panel {
          width: 100vw;
          height: 100vh;
          border-radius: 0;
          margin: 0;
        }
        
        .techsurf-chat-widget {
          top: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          left: 0 !important;
        }
      }
    `;
  }

  private getLightTheme() {
    return {
      primary: this.config.primaryColor || '#007bff',
      primaryDark: this.config.primaryColor ? this.darkenColor(this.config.primaryColor, 10) : '#0056b3',
      background: '#ffffff',
      messageBg: '#f8f9fa',
      inputBg: '#ffffff',
      text: '#212529',
      textSecondary: '#6c757d',
      border: '#e9ecef'
    };
  }

  private getDarkTheme() {
    return {
      primary: this.config.primaryColor || '#007bff',
      primaryDark: this.config.primaryColor ? this.darkenColor(this.config.primaryColor, 10) : '#0056b3',
      background: '#2d3748',
      messageBg: '#4a5568',
      inputBg: '#4a5568',
      text: '#ffffff',
      textSecondary: '#a0aec0',
      border: '#4a5568'
    };
  }

  private darkenColor(color: string, percent: number): string {
    // Simple color darkening function
    const f = parseInt(color.slice(1), 16);
    const t = percent < 0 ? 0 : 255;
    const p = percent < 0 ? percent * -1 : percent;
    const R = f >> 16;
    const G = f >> 8 & 0x00FF;
    const B = f & 0x0000FF;
    return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
  }

  private getPositionStyles(): string {
    const margin = '20px';
    
    switch (this.config.position) {
      case 'bottom-left':
        return `bottom: ${margin}; left: ${margin};`;
      case 'bottom-right':
        return `bottom: ${margin}; right: ${margin};`;
      case 'top-left':
        return `top: ${margin}; left: ${margin};`;
      case 'top-right':
        return `top: ${margin}; right: ${margin};`;
      default:
        return `bottom: ${margin}; right: ${margin};`;
    }
  }

  private createWidget(): void {
    // Remove existing widget if any
    const existing = document.getElementById('techsurf-chat-widget');
    if (existing) existing.remove();

    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'techsurf-chat-widget';
    this.container.className = 'techsurf-chat-widget';

    // Create HTML structure
    this.container.innerHTML = `
      <div class="techsurf-chat-panel">
        <div class="techsurf-chat-header">
          <div class="techsurf-chat-header-content">
            <h4 class="techsurf-chat-title">${this.config.title || 'Chat with us'}</h4>
            <p class="techsurf-chat-subtitle">We typically reply in a few minutes</p>
          </div>
          <button class="techsurf-chat-close" type="button">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 8.586L15.657 2.929a1 1 0 111.414 1.414L11.414 10l5.657 5.657a1 1 0 01-1.414 1.414L10 11.414l-5.657 5.657a1 1 0 01-1.414-1.414L8.586 10 2.929 4.343A1 1 0 014.343 2.929L10 8.586z"/>
            </svg>
          </button>
        </div>
        <div class="techsurf-chat-messages">
          <div class="techsurf-chat-welcome">
            <h3>👋 Welcome!</h3>
            <p>${this.config.welcomeMessage || 'Hello! How can I help you today?'}</p>
          </div>
        </div>
        <div class="techsurf-chat-typing" style="display: none;">
          <span class="techsurf-chat-typing-dots">AI is typing</span>
        </div>
        <div class="techsurf-chat-input">
          <div class="techsurf-chat-input-container">
            <textarea 
              class="techsurf-chat-input-field" 
              placeholder="Type your message..."
              rows="1"
            ></textarea>
            <button class="techsurf-chat-send-button" type="button">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M15.854.146a.5.5 0 01.11.54L13.026 8.74a.5.5 0 01-.456.302H8.5V4.5a.5.5 0 00-.854-.353L.646 11.147a.5.5 0 00.708.707l6.5-6.5V10.5a.5.5 0 00.5.5h4.07l2.938-7.94a.5.5 0 01.692-.414z"/>
              </svg>
            </button>
          </div>
        </div>
        ${this.config.showPoweredBy !== false ? `
          <div class="techsurf-chat-powered-by">
            Powered by <a href="https://techsurf.ai" target="_blank">TechSurf</a>
          </div>
        ` : ''}
      </div>
      <button class="techsurf-chat-button" type="button">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v3c0 .6.4 1 1 1 .2 0 .3 0 .4-.1L14.5 18H20c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 13h-4.8l-2.7 2.7V15H5V5h14v10z"/>
        </svg>
      </button>
    `;

    document.body.appendChild(this.container);
  }

  private setupEventListeners(): void {
    if (!this.container) return;

    const button = this.container.querySelector('.techsurf-chat-button') as HTMLButtonElement;
    const closeButton = this.container.querySelector('.techsurf-chat-close') as HTMLButtonElement;
    const sendButton = this.container.querySelector('.techsurf-chat-send-button') as HTMLButtonElement;
    const input = this.container.querySelector('.techsurf-chat-input-field') as HTMLTextAreaElement;

    button?.addEventListener('click', this.toggle);
    closeButton?.addEventListener('click', this.close);
    sendButton?.addEventListener('click', () => this.handleSendMessage());
    
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });

    input?.addEventListener('input', this.handleInputResize);
  }

  private handleInputResize = (e: Event): void => {
    const textarea = e.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  };

  private async handleSendMessage(): Promise<void> {
    const input = this.container?.querySelector('.techsurf-chat-input-field') as HTMLTextAreaElement;
    const message = input?.value.trim();

    if (!message || !this.container) return;

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Add user message to UI
    this.addMessageToUI({
      role: 'user',
      content: message,
      timestamp: new Date(),
      id: this.generateMessageId()
    });

    // Send message to API
    try {
      await this.sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      this.addMessageToUI({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        id: this.generateMessageId()
      });
    }
  }

  private generateMessageId(): string {
    return 'msg_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private addMessageToUI(message: ChatMessage): void {
    const messagesContainer = this.container?.querySelector('.techsurf-chat-messages');
    const welcomeMessage = messagesContainer?.querySelector('.techsurf-chat-welcome');
    
    if (welcomeMessage && this.messages.length === 0) {
      welcomeMessage.remove();
    }

    if (!messagesContainer) return;

    const messageEl = document.createElement('div');
    messageEl.className = `techsurf-chat-message ${message.role}`;
    messageEl.innerHTML = `
      <div class="techsurf-chat-message-content">
        ${this.formatMessageContent(message.content)}
      </div>
      <div class="techsurf-chat-message-time">
        ${this.formatTime(message.timestamp)}
      </div>
    `;

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Store message
    this.messages.push(message);
    
    // Limit messages in memory
    if (this.messages.length > (this.config.maxMessages || 50)) {
      this.messages = this.messages.slice(-this.config.maxMessages!);
    }

    this.emit('messageAdded', message);
  }

  private formatMessageContent(content: string): string {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  private formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private showTypingIndicator(): void {
    const typingEl = this.container?.querySelector('.techsurf-chat-typing') as HTMLElement;
    if (typingEl) {
      typingEl.style.display = 'block';
    }
  }

  private hideTypingIndicator(): void {
    const typingEl = this.container?.querySelector('.techsurf-chat-typing') as HTMLElement;
    if (typingEl) {
      typingEl.style.display = 'none';
    }
  }

  // Public API methods
  public open(): void {
    if (!this.container) return;
    
    const panel = this.container.querySelector('.techsurf-chat-panel');
    const button = this.container.querySelector('.techsurf-chat-button');
    
    panel?.classList.add('open');
    button?.classList.add('open');
    
    this.isOpen = true;
    this.emit('opened');
    
    // Focus input
    const input = this.container.querySelector('.techsurf-chat-input-field') as HTMLTextAreaElement;
    setTimeout(() => input?.focus(), 300);
  }

  public close(): void {
    if (!this.container) return;
    
    const panel = this.container.querySelector('.techsurf-chat-panel');
    const button = this.container.querySelector('.techsurf-chat-button');
    
    panel?.classList.remove('open');
    button?.classList.remove('open');
    
    this.isOpen = false;
    this.emit('closed');
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public async sendMessage(content: string): Promise<void> {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      id: this.generateMessageId()
    };

    this.showTypingIndicator();

    try {
      // Prepare messages for API
      const messagesToSend = [...this.messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch(`${this.config.apiUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'x-tenant-id': this.config.tenantId
        },
        body: JSON.stringify({
          messages: messagesToSend,
          websiteContext: this.config.websiteContext || {}
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Handle streaming response
      await this.handleStreamingResponse(response);

    } catch (error) {
      console.error('❌ Send message error:', error);
      this.addMessageToUI({
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date(),
        id: this.generateMessageId()
      });
    } finally {
      this.hideTypingIndicator();
    }
  }

  private async handleStreamingResponse(response: Response): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let assistantMessage = '';
    let messageId = this.generateMessageId();
    let messageElement: HTMLElement | null = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content' && parsed.content) {
                assistantMessage += parsed.content;
                
                // Create or update message element
                if (!messageElement) {
                  const message: ChatMessage = {
                    role: 'assistant',
                    content: assistantMessage,
                    timestamp: new Date(),
                    id: messageId
                  };
                  this.addMessageToUI(message);
                  messageElement = this.container?.querySelector(`.techsurf-chat-message:last-child .techsurf-chat-message-content`) as HTMLElement;
                } else {
                  // Update existing message
                  messageElement.innerHTML = this.formatMessageContent(assistantMessage);
                  const messagesContainer = this.container?.querySelector('.techsurf-chat-messages');
                  if (messagesContainer) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                  }
                }
              } else if (parsed.type === 'completion') {
                // Message completed
                break;
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error);
              }
            } catch (parseError) {
              console.warn('Failed to parse stream data:', parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  public destroy(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    
    const styles = document.getElementById('techsurf-chat-styles');
    if (styles) {
      styles.remove();
    }
    
    this.eventListeners = {};
    this.isInitialized = false;
    this.emit('destroyed');
  }

  public on(event: string, callback: Function): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  public off(event: string, callback?: Function): void {
    if (!this.eventListeners[event]) return;
    
    if (callback) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    } else {
      delete this.eventListeners[event];
    }
  }

  private emit(event: string, data?: any): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  // Getters
  public getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  public getConfig(): ChatWidgetConfig {
    return { ...this.config };
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public isWidgetOpen(): boolean {
    return this.isOpen;
  }

  public isWidgetInitialized(): boolean {
    return this.isInitialized;
  }
}

export default UniversalChatWidget;
