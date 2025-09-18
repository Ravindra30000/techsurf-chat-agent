import React, { useState } from 'react';
import styled from 'styled-components';
import { Play, MessageCircle, Zap, Settings, Code, Monitor } from 'lucide-react';

import Container from '../components/common/Container';
import Section from '../components/common/Section';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import CodeBlock from '../components/common/CodeBlock';

const DemoSection = styled(Section)`
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const DemoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space['2xl']};
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.space.xl};
  }
`;

const DemoWidget = styled(Card)`
  height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const DemoHeader = styled.div`
  padding: ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`;

const DemoContent = styled.div`
  flex: 1;
  padding: ${({ theme }) => theme.space.lg};
  display: flex;
  flex-direction: column;
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: ${({ theme }) => theme.space.md};
`;

const Message = styled.div<{ isUser: boolean }>`
  display: flex;
  justify-content: ${({ isUser }) => isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: ${({ theme }) => theme.space.md};

  .message-bubble {
    max-width: 80%;
    padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
    border-radius: ${({ theme }) => theme.radii.lg};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: ${({ theme }) => theme.lineHeights.normal};
    
    ${({ isUser, theme }) => isUser ? `
      background: ${theme.colors.primary};
      color: white;
    ` : `
      background: ${theme.colors.gray[100]};
      color: ${theme.colors.dark};
    `}
  }
`;

const InputArea = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.sm};
  
  input {
    flex: 1;
    padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
    border: 1px solid ${({ theme }) => theme.colors.gray[300]};
    border-radius: ${({ theme }) => theme.radii.md};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }

  button {
    padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
    background: ${({ theme }) => theme.colors.primary};
    color: white;
    border: none;
    border-radius: ${({ theme }) => theme.radii.md};
    cursor: pointer;
    transition: background 0.2s ease-in-out;

    &:hover {
      background: ${({ theme }) => theme.colors.primaryHover};
    }
  }
`;

const ConfigPanel = styled(Card)`
  padding: ${({ theme }) => theme.space.lg};
  height: fit-content;
`;

const ConfigSection = styled.div`
  margin-bottom: ${({ theme }) => theme.space.lg};
  
  h4 {
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    margin-bottom: ${({ theme }) => theme.space.sm};
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.space.xs};
  }
`;

const ConfigOption = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.space.sm};
  
  label {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.gray[700]};
  }
  
  select, input {
    padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
    border: 1px solid ${({ theme }) => theme.colors.gray[300]};
    border-radius: ${({ theme }) => theme.radii.sm};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

const BusinessTypeSelector = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.sm};
  margin-bottom: ${({ theme }) => theme.space.lg};
  flex-wrap: wrap;
`;

const BusinessTypeButton = styled.button<{ active: boolean }>`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme, active }) => active ? theme.colors.primary : theme.colors.gray[300]};
  background: ${({ theme, active }) => active ? theme.colors.primary : 'white'};
  color: ${({ theme, active }) => active ? 'white' : theme.colors.gray[700]};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const DemoPage: React.FC = () => {
  const [businessType, setBusinessType] = useState('ecommerce');
  const [messages, setMessages] = useState([
    { id: 1, isUser: false, content: "Hi! I'm your AI assistant. I can help you with products, general questions, or anything else. What would you like to know?" },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const businessTypes = [
    { id: 'ecommerce', label: 'E-commerce', icon: '🛍️' },
    { id: 'travel', label: 'Travel', icon: '✈️' },
    { id: 'tech', label: 'Tech/SaaS', icon: '💻' },
    { id: 'education', label: 'Education', icon: '📚' },
  ];

  const sampleQueries = {
    ecommerce: [
      "Show me your best smartphones",
      "What's your return policy?",
      "Do you have any laptop deals?"
    ],
    travel: [
      "Find flights to Paris",
      "Show me beach destinations",
      "What's included in the tour package?"
    ],
    tech: [
      "What are your pricing plans?",
      "How does the integration work?",
      "Do you offer API access?"
    ],
    education: [
      "Tell me about your courses",
      "What certifications do you offer?",
      "How long is the program?"
    ]
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      isUser: true,
      content: text
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let aiResponse = "I understand you're asking about that. Let me help you find the information you need.";
      
      // Context-aware responses based on business type and query
      const query = text.toLowerCase();
      if (businessType === 'ecommerce') {
        if (query.includes('smartphone') || query.includes('phone')) {
          aiResponse = "🛍️ I found 3 great smartphones in our catalog:\n\n📱 iPhone 15 Pro - $999\n📱 Samsung Galaxy S24 - $899\n📱 Google Pixel 8 - $699\n\nWould you like to see detailed specs or compare features?";
        } else if (query.includes('laptop')) {
          aiResponse = "💻 Here are our current laptop deals:\n\n• MacBook Air M2 - $1,099 (Save $200)\n• Dell XPS 13 - $899 (Save $150)\n• HP Pavilion - $649 (Save $100)\n\nAll include free shipping and 1-year warranty!";
        }
      } else if (businessType === 'travel') {
        if (query.includes('paris') || query.includes('flight')) {
          aiResponse = "✈️ Found great flights to Paris:\n\n🛫 Delta - $789 (Direct)\n🛫 Air France - $823 (1 stop)\n🛫 United - $756 (1 stop)\n\nDates: Next month. Would you like me to check specific dates?";
        }
      }

      const aiMessage = {
        id: messages.length + 2,
        isUser: false,
        content: aiResponse
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickQuery = (query: string) => {
    handleSendMessage(query);
  };

  const integrationCode = `<!-- Add to any website -->
<script src="https://cdn.techsurf.ai/widget.js"></script>
<script>
  TechSurfChat.init({
    apiKey: 'your-api-key',
    businessType: '${businessType}',
    theme: {
      primaryColor: '#007bff',
      position: 'bottom-right'
    }
  });
</script>`;

  return (
    <>
      <Section style={{ paddingTop: '2rem' }}>
        <Container>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Try the Live Demo
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#6c757d', maxWidth: '600px', margin: '0 auto' }}>
              Experience the power of AI-driven customer support. Choose a business type and see how 
              our widget intelligently handles different types of queries.
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', textAlign: 'center' }}>
              Choose Your Business Type
            </h3>
            <BusinessTypeSelector style={{ justifyContent: 'center' }}>
              {businessTypes.map((type) => (
                <BusinessTypeButton
                  key={type.id}
                  active={businessType === type.id}
                  onClick={() => setBusinessType(type.id)}
                >
                  {type.icon} {type.label}
                </BusinessTypeButton>
              ))}
            </BusinessTypeSelector>
          </div>
        </Container>
      </Section>

      <DemoSection>
        <Container>
          <DemoGrid>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                <MessageCircle size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Interactive Demo
              </h2>
              
              <DemoWidget>
                <DemoHeader>
                  <Monitor size={18} />
                  TechSurf AI Assistant - {businessTypes.find(t => t.id === businessType)?.label}
                </DemoHeader>
                
                <DemoContent>
                  <MessageList>
                    {messages.map((message) => (
                      <Message key={message.id} isUser={message.isUser}>
                        <div className="message-bubble">
                          {message.content}
                        </div>
                      </Message>
                    ))}
                    
                    {isTyping && (
                      <Message isUser={false}>
                        <div className="message-bubble">
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#999', animation: 'pulse 1.5s infinite' }}></div>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#999', animation: 'pulse 1.5s infinite 0.2s' }}></div>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#999', animation: 'pulse 1.5s infinite 0.4s' }}></div>
                            <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#666' }}>AI is typing...</span>
                          </div>
                        </div>
                      </Message>
                    )}
                  </MessageList>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                      Try these sample queries:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {sampleQueries[businessType as keyof typeof sampleQueries]?.map((query, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickQuery(query)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#f8f9fa',
                            border: '1px solid #dee2e6',
                            borderRadius: '1rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#e9ecef';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = '#f8f9fa';
                          }}
                        >
                          {query}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <InputArea>
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                    />
                    <button onClick={() => handleSendMessage()}>
                      Send
                    </button>
                  </InputArea>
                </DemoContent>
              </DemoWidget>
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                <Code size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Integration Code
              </h2>
              
              <ConfigPanel>
                <ConfigSection>
                  <h4>
                    <Settings size={16} />
                    Widget Configuration
                  </h4>
                  <ConfigOption>
                    <label>Business Type:</label>
                    <select 
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                    >
                      {businessTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </ConfigOption>
                  <ConfigOption>
                    <label>Position:</label>
                    <select>
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="top-right">Top Right</option>
                    </select>
                  </ConfigOption>
                  <ConfigOption>
                    <label>Theme Color:</label>
                    <input type="color" defaultValue="#007bff" />
                  </ConfigOption>
                </ConfigSection>

                <CodeBlock 
                  code={integrationCode}
                  language="html"
                  title="HTML Integration"
                />

                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <Button size="lg">
                    <Play size={16} />
                    Get Started Now
                  </Button>
                </div>
              </ConfigPanel>
            </div>
          </DemoGrid>
        </Container>
      </DemoSection>

      <Section>
        <Container>
          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Ready to Add Intelligent Chat to Your Website?
            </h2>
            <p style={{ fontSize: '1.25rem', color: '#6c757d', marginBottom: '2rem' }}>
              Join thousands of websites using TechSurf to provide instant, intelligent customer support.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button size="lg">
                <Zap size={16} />
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      <style>
        {`
          @keyframes pulse {
            0%, 20%, 50%, 80%, 100% {
              opacity: 1;
            }
            40% {
              opacity: 0.5;
            }
          }
        `}
      </style>
    </>
  );
};

export default DemoPage;