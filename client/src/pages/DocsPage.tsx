import React from 'react';
import styled from 'styled-components';
import { Book, ExternalLink, Download, Code, Zap, Settings } from 'lucide-react';
import { useParams } from 'react-router-dom';

import Container from '../components/common/Container';
import Section from '../components/common/Section';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import CodeBlock from '../components/common/CodeBlock';

const DocsLayout = styled.div`
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: ${({ theme }) => theme.space['2xl']};
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.space.xl};
  }
`;

const Sidebar = styled.div`
  position: sticky;
  top: 100px;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: relative;
    top: 0;
  }
`;

const SidebarSection = styled.div`
  margin-bottom: ${({ theme }) => theme.space.xl};

  h3 {
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    margin-bottom: ${({ theme }) => theme.space.sm};
    color: ${({ theme }) => theme.colors.dark};
  }
`;

const SidebarLink = styled.a<{ active?: boolean }>`
  display: block;
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  color: ${({ active, theme }) => active ? theme.colors.primary : theme.colors.gray[600]};
  text-decoration: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: all 0.2s ease-in-out;
  background: ${({ active, theme }) => active ? theme.colors.gray[100] : 'transparent'};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const DocContent = styled.div`
  max-width: none;

  h1 {
    font-size: ${({ theme }) => theme.fontSizes['4xl']};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    margin-bottom: ${({ theme }) => theme.space.lg};
    color: ${({ theme }) => theme.colors.dark};
  }

  h2 {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    margin: ${({ theme }) => theme.space['2xl']} 0 ${({ theme }) => theme.space.md};
    color: ${({ theme }) => theme.colors.dark};
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
    padding-bottom: ${({ theme }) => theme.space.sm};
  }

  h3 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    margin: ${({ theme }) => theme.space.xl} 0 ${({ theme }) => theme.space.sm};
    color: ${({ theme }) => theme.colors.dark};
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: ${({ theme }) => theme.lineHeights.relaxed};
    color: ${({ theme }) => theme.colors.gray[700]};
    margin-bottom: ${({ theme }) => theme.space.md};
  }

  ul, ol {
    margin-bottom: ${({ theme }) => theme.space.md};
    padding-left: ${({ theme }) => theme.space.lg};

    li {
      font-size: ${({ theme }) => theme.fontSizes.md};
      line-height: ${({ theme }) => theme.lineHeights.relaxed};
      color: ${({ theme }) => theme.colors.gray[700]};
      margin-bottom: ${({ theme }) => theme.space.xs};
    }
  }

  code {
    background: ${({ theme }) => theme.colors.gray[100]};
    padding: 0.125rem 0.25rem;
    border-radius: ${({ theme }) => theme.radii.sm};
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.875em;
  }
`;

const QuickLinks = styled(Card)`
  padding: ${({ theme }) => theme.space.lg};
  margin-bottom: ${({ theme }) => theme.space.xl};
  background: ${({ theme }) => theme.colors.blue};
  color: white;

  h3 {
    color: white;
    margin-bottom: ${({ theme }) => theme.space.md};
  }

  a {
    color: white;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.space.xs};
    margin-bottom: ${({ theme }) => theme.space.sm};
    font-size: ${({ theme }) => theme.fontSizes.sm};

    &:hover {
      text-decoration: underline;
    }
  }
`;

const DocsPage: React.FC = () => {
  const { section } = useParams();
  
  const sidebarSections = [
    {
      title: 'Getting Started',
      links: [
        { title: 'Quick Start', href: '/docs/quick-start', active: !section || section === 'quick-start' },
        { title: 'Installation', href: '/docs/installation' },
        { title: 'Configuration', href: '/docs/configuration' },
      ]
    },
    {
      title: 'Integration',
      links: [
        { title: 'HTML Integration', href: '/docs/html-integration' },
        { title: 'React Integration', href: '/docs/react-integration' },
        { title: 'WordPress Plugin', href: '/docs/wordpress' },
        { title: 'Contentstack Setup', href: '/docs/contentstack' },
      ]
    },
    {
      title: 'API Reference',
      links: [
        { title: 'Chat API', href: '/docs/api/chat' },
        { title: 'Widget API', href: '/docs/api/widget' },
        { title: 'Analytics API', href: '/docs/api/analytics' },
        { title: 'Webhooks', href: '/docs/api/webhooks' },
      ]
    },
    {
      title: 'Advanced',
      links: [
        { title: 'Custom Themes', href: '/docs/theming' },
        { title: 'Multi-tenant Setup', href: '/docs/multi-tenant' },
        { title: 'Security', href: '/docs/security' },
        { title: 'Performance', href: '/docs/performance' },
      ]
    }
  ];

  const quickStartCode = `<!-- 1. Add the script tag -->
<script src="https://cdn.techsurf.ai/widget/v1/universal-chat.js"></script>

<!-- 2. Initialize with your API key -->
<script>
  TechSurfChat.init({
    apiKey: 'your-api-key-here',
    // Optional: Auto-detect Contentstack
    // Or manually configure:
    contentstack: {
      apiKey: 'your-contentstack-api-key',
      deliveryToken: 'your-delivery-token',
      environment: 'production'
    }
  });
</script>`;

  const reactCode = `import { UniversalChatWidget } from '@techsurf/universal-chat-widget';

function App() {
  React.useEffect(() => {
    const widget = new UniversalChatWidget({
      apiKey: 'your-api-key-here',
      theme: {
        primaryColor: '#007bff',
        position: 'bottom-right'
      }
    });

    widget.mount('body');

    return () => widget.unmount();
  }, []);

  return <div>Your app content</div>;
}`;

  const configCode = `TechSurfChat.init({
  // Required
  apiKey: 'your-api-key',
  
  // Optional: Contentstack configuration
  contentstack: {
    apiKey: 'bltxxxxx',
    deliveryToken: 'csxxxxxx',
    environment: 'production',
    region: 'us'
  },
  
  // Optional: Theming
  theme: {
    primaryColor: '#007bff',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    borderRadius: 12,
    fontFamily: 'Inter, sans-serif',
    position: 'bottom-right'
  },
  
  // Optional: Branding
  branding: {
    name: 'Your Company',
    logo: 'https://your-domain.com/logo.png',
    colors: {
      primary: '#007bff',
      secondary: '#6c757d'
    }
  },
  
  // Optional: Advanced options
  enableAnalytics: true,
  enableSounds: false,
  autoDetect: true,
  
  // Optional: Event handlers
  onMount: () => console.log('Widget mounted'),
  onMessageSent: (message) => console.log('Message sent:', message),
  onError: (error) => console.error('Widget error:', error)
});`;

  return (
    <Section style={{ paddingTop: '2rem' }}>
      <Container>
        <DocsLayout>
          <Sidebar>
            {sidebarSections.map((section, index) => (
              <SidebarSection key={index}>
                <h3>{section.title}</h3>
                {section.links.map((link, linkIndex) => (
                  <SidebarLink
                    key={linkIndex}
                    href={link.href}
                    active={link.active}
                  >
                    {link.title}
                  </SidebarLink>
                ))}
              </SidebarSection>
            ))}
          </Sidebar>

          <DocContent>
            <QuickLinks>
              <h3>🚀 Quick Links</h3>
              <a href="/demo">
                <Zap size={16} />
                Try Live Demo
              </a>
              <a href="/docs/examples">
                <Code size={16} />
                View Examples
              </a>
              <a href="https://github.com/techsurf/universal-chat-widget" target="_blank">
                <ExternalLink size={16} />
                GitHub Repository
              </a>
              <a href="/docs/api">
                <Book size={16} />
                API Reference
              </a>
            </QuickLinks>

            <h1>
              <Book size={32} style={{ display: 'inline', marginRight: '12px' }} />
              Getting Started
            </h1>
            
            <p>
              Welcome to TechSurf Universal Chat Widget documentation! This guide will help you integrate 
              intelligent AI-powered chat into your website in just a few minutes.
            </p>

            <h2>✨ What is TechSurf?</h2>
            <p>
              TechSurf is a universal AI-powered chat widget that provides intelligent customer support 
              for any website. It automatically detects when users need content-specific information 
              (from your Contentstack CMS) versus general conversation, providing contextual and helpful responses.
            </p>

            <h3>Key Features</h3>
            <ul>
              <li><strong>🧠 Smart AI Routing</strong> - Automatically detects content vs general queries</li>
              <li><strong>⚡ 5-minute Setup</strong> - One line of code integration</li>
              <li><strong>🏗️ Contentstack Native</strong> - Built for Contentstack Launch platform</li>
              <li><strong>🎨 Fully Customizable</strong> - Match your brand with custom themes</li>
              <li><strong>📊 Analytics Dashboard</strong> - Track conversations and performance</li>
              <li><strong>🌐 Universal Compatibility</strong> - Works with any website or framework</li>
            </ul>

            <h2>🚀 Quick Start (HTML)</h2>
            <p>
              The fastest way to add TechSurf to your website is with our CDN script. 
              This works with any HTML page, CMS, or static site generator.
            </p>

            <CodeBlock
              code={quickStartCode}
              language="html"
              title="HTML Quick Start"
            />

            <p>
              That's it! The widget will automatically appear in the bottom-right corner of your website. 
              If you have Contentstack meta tags on your page, it will auto-detect your configuration.
            </p>

            <h3>Auto-Detection</h3>
            <p>
              For automatic Contentstack detection, add these meta tags to your HTML head:
            </p>

            <CodeBlock
              code={`<meta name="contentstack-api-key" content="bltxxxxx">
<meta name="contentstack-delivery-token" content="csxxxxxx">
<meta name="contentstack-environment" content="production">`}
              language="html"
              title="Contentstack Meta Tags"
            />

            <h2>⚛️ React Integration</h2>
            <p>
              For React applications, install our NPM package for better TypeScript support and React hooks.
            </p>

            <CodeBlock
              code="npm install @techsurf/universal-chat-widget"
              language="bash"
              title="Install via NPM"
            />

            <CodeBlock
              code={reactCode}
              language="jsx"
              title="React Component Usage"
            />

            <h2>⚙️ Configuration Options</h2>
            <p>
              TechSurf offers extensive configuration options to match your needs:
            </p>

            <CodeBlock
              code={configCode}
              language="javascript"
              title="Complete Configuration Example"
            />

            <h2>🏗️ Contentstack Setup</h2>
            <p>
              To enable intelligent content queries, you'll need to configure TechSurf with your Contentstack credentials:
            </p>

            <ol>
              <li>Go to your Contentstack dashboard</li>
              <li>Navigate to Settings → API Keys</li>
              <li>Create a new Delivery Token or use existing one</li>
              <li>Note your Stack API Key and Delivery Token</li>
              <li>Add these to your TechSurf configuration</li>
            </ol>

            <h3>Content Types</h3>
            <p>
              TechSurf automatically works with any Contentstack content type. It intelligently queries your content based on user questions:
            </p>

            <ul>
              <li><strong>Products</strong> - "Show me your laptops" → Queries product content type</li>
              <li><strong>Articles</strong> - "How do I reset my password?" → Searches help articles</li>
              <li><strong>Events</strong> - "What events are coming up?" → Finds upcoming events</li>
              <li><strong>Any Custom Type</strong> - Works with your specific content model</li>
            </ul>

            <h2>📊 Analytics & Monitoring</h2>
            <p>
              Track your widget performance with built-in analytics:
            </p>

            <ul>
              <li>Conversation metrics and volume</li>
              <li>Response times and satisfaction scores</li>
              <li>Popular queries and content requests</li>
              <li>User engagement and conversion tracking</li>
            </ul>

            <h2>🎨 Customization</h2>
            <p>
              Make the widget match your brand:
            </p>

            <ul>
              <li><strong>Colors & Themes</strong> - Custom color schemes and dark mode</li>
              <li><strong>Positioning</strong> - Place anywhere on your page</li>
              <li><strong>Branding</strong> - Add your logo and company name</li>
              <li><strong>Custom CSS</strong> - Full control over appearance</li>
            </ul>

            <h2>🔗 Next Steps</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
              <Card style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={20} />
                  Try the Demo
                </h3>
                <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                  See TechSurf in action with our interactive demo
                </p>
                <Button size="sm" style={{ width: '100%' }}>
                  Launch Demo
                </Button>
              </Card>

              <Card style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Code size={20} />
                  API Reference
                </h3>
                <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                  Detailed documentation for all APIs
                </p>
                <Button size="sm" variant="outline" style={{ width: '100%' }}>
                  View API Docs
                </Button>
              </Card>

              <Card style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={20} />
                  Advanced Setup
                </h3>
                <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                  Multi-tenant and enterprise configurations
                </p>
                <Button size="sm" variant="outline" style={{ width: '100%' }}>
                  Advanced Guide
                </Button>
              </Card>
            </div>

            <div style={{ 
              background: '#f8f9fa', 
              padding: '2rem', 
              borderRadius: '0.5rem', 
              marginTop: '3rem',
              textAlign: 'center'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>Need Help?</h3>
              <p style={{ marginBottom: '1.5rem', color: '#6c757d' }}>
                Our team is here to help you get started with TechSurf.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button size="sm">
                  Contact Support
                </Button>
                <Button size="sm" variant="outline">
                  Join Discord
                </Button>
              </div>
            </div>
          </DocContent>
        </DocsLayout>
      </Container>
    </Section>
  );
};

export default DocsPage;