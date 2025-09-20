import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, Zap, Shield, Settings, BarChart3 } from 'lucide-react';
import Container from '../components/common/Container';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Section from '../components/common/Section';

const Hero = styled(Section)`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.primaryHover} 100%);
  color: white;
  text-align: center;
  padding: 120px 0;
  
  h1 {
    font-size: ${({ theme }) => theme.fontSizes['5xl']};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    margin-bottom: ${({ theme }) => theme.space.lg};
    line-height: ${({ theme }) => theme.lineHeights.tight};
  }
  
  p {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin-bottom: ${({ theme }) => theme.space['2xl']};
    opacity: 0.9;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.space.xl};
  margin-top: ${({ theme }) => theme.space['3xl']};
`;

const FeatureCard = styled(Card)`
  text-align: center;
  padding: ${({ theme }) => theme.space['2xl']};
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: ${({ theme }) => theme.shadows.xl};
  }
  
  .icon {
    width: 60px;
    height: 60px;
    margin: 0 auto ${({ theme }) => theme.space.lg};
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primaryHover});
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
  
  h3 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    margin-bottom: ${({ theme }) => theme.space.md};
    color: ${({ theme }) => theme.colors.dark};
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray};
    line-height: ${({ theme }) => theme.lineHeights.relaxed};
  }
`;

const StatsSection = styled(Section)`
  background: ${({ theme }) => theme.colors.gray};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.space.xl};
  text-align: center;
`;

const StatCard = styled.div`
  .number {
    font-size: ${({ theme }) => theme.fontSizes['4xl']};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.primary};
    display: block;
  }
  
  .label {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    color: ${({ theme }) => theme.colors.gray};
    margin-top: ${({ theme }) => theme.space.sm};
  }
`;

const CTASection = styled(Section)`
  background: ${({ theme }) => theme.colors.dark};
  color: white;
  text-align: center;
`;

const HomePage: React.FC = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <>
      <Hero>
        <Container>
          <motion.div {...fadeInUp}>
            <h1>
              🚀 TechSurf Chat Platform
            </h1>
            <p>
              Transform your website with AI-powered chat widgets that integrate seamlessly with Contentstack. 
              Provide instant, intelligent customer support that scales with your business.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button size="lg" as="a" href="/demo">
                Try Live Demo <ArrowRight size={20} />
              </Button>
              <Button variant="outline" size="lg" as="a" href="/docs">
                View Documentation
              </Button>
            </div>
          </motion.div>
        </Container>
      </Hero>

      <Section>
        <Container>
          <motion.div 
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
                Why Choose TechSurf?
              </h2>
              <p style={{ fontSize: '1.2rem', color: '#6c757d', maxWidth: '600px', margin: '0 auto' }}>
                Built for modern websites that need intelligent, scalable customer support solutions.
              </p>
            </motion.div>

            <FeatureGrid>
              <motion.div variants={fadeInUp}>
                <FeatureCard>
                  <div className="icon">
                    <MessageSquare size={28} />
                  </div>
                  <h3>Smart AI Conversations</h3>
                  <p>
                    Powered by advanced language models like Llama and GPT, providing human-like responses 
                    that understand context and intent.
                  </p>
                </FeatureCard>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <FeatureCard>
                  <div className="icon">
                    <Zap size={28} />
                  </div>
                  <h3>Contentstack Integration</h3>
                  <p>
                    Automatically retrieves relevant content from your Contentstack CMS, ensuring 
                    accurate and up-to-date information in every conversation.
                  </p>
                </FeatureCard>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <FeatureCard>
                  <div className="icon">
                    <Shield size={28} />
                  </div>
                  <h3>Enterprise Security</h3>
                  <p>
                    Built with security-first principles, featuring API key authentication, 
                    rate limiting, and comprehensive audit logging.
                  </p>
                </FeatureCard>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <FeatureCard>
                  <div className="icon">
                    <Settings size={28} />
                  </div>
                  <h3>Easy Integration</h3>
                  <p>
                    Deploy in minutes with our universal widget SDK. Works with any website, 
                    framework, or CMS with just a few lines of code.
                  </p>
                </FeatureCard>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <FeatureCard>
                  <div className="icon">
                    <BarChart3 size={28} />
                  </div>
                  <h3>Analytics & Insights</h3>
                  <p>
                    Comprehensive analytics dashboard to track conversation metrics, 
                    user satisfaction, and optimize your support experience.
                  </p>
                </FeatureCard>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <FeatureCard>
                  <div className="icon">
                    <Zap size={28} />
                  </div>
                  <h3>Real-time Streaming</h3>
                  <p>
                    Lightning-fast responses with real-time streaming technology. 
                    Users see responses as they're generated for a smooth experience.
                  </p>
                </FeatureCard>
              </motion.div>
            </FeatureGrid>
          </motion.div>
        </Container>
      </Section>

      <StatsSection>
        <Container>
          <motion.div variants={fadeInUp}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
                Trusted by Growing Businesses
              </h2>
              <p style={{ fontSize: '1.2rem', color: '#6c757d' }}>
                See the impact TechSurf has on customer engagement and support efficiency.
              </p>
            </div>

            <StatsGrid>
              <motion.div variants={fadeInUp}>
                <StatCard>
                  <span className="number">50,000+</span>
                  <span className="label">Conversations Processed</span>
                </StatCard>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <StatCard>
                  <span className="number">95%</span>
                  <span className="label">Query Resolution Rate</span>
                </StatCard>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <StatCard>
                  <span className="number">2.1s</span>
                  <span className="label">Average Response Time</span>
                </StatCard>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <StatCard>
                  <span className="number">4.8/5</span>
                  <span className="label">Customer Satisfaction</span>
                </StatCard>
              </motion.div>
            </StatsGrid>
          </motion.div>
        </Container>
      </StatsSection>

      <Section>
        <Container>
          <motion.div variants={fadeInUp}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
                How It Works
              </h2>
              <p style={{ fontSize: '1.2rem', color: '#6c757d', maxWidth: '600px', margin: '0 auto' }}>
                Get started with TechSurf in three simple steps.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginTop: '48px' }}>
              <motion.div variants={fadeInUp}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    background: 'linear-gradient(135deg, #007bff, #0056b3)', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 24px',
                    color: 'white',
                    fontSize: '2rem',
                    fontWeight: 'bold'
                  }}>
                    1
                  </div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Setup Your Account</h3>
                  <p style={{ color: '#6c757d', lineHeight: '1.6' }}>
                    Create your TechSurf account, configure your Contentstack integration, 
                    and customize your widget appearance to match your brand.
                  </p>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    background: 'linear-gradient(135deg, #28a745, #1e7e34)', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 24px',
                    color: 'white',
                    fontSize: '2rem',
                    fontWeight: 'bold'
                  }}>
                    2
                  </div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Install the Widget</h3>
                  <p style={{ color: '#6c757d', lineHeight: '1.6' }}>
                    Add our lightweight JavaScript widget to your website with just one line of code. 
                    Works with any website, CMS, or framework.
                  </p>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    background: 'linear-gradient(135deg, #ffc107, #e0a800)', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 24px',
                    color: 'white',
                    fontSize: '2rem',
                    fontWeight: 'bold'
                  }}>
                    3
                  </div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Start Engaging</h3>
                  <p style={{ color: '#6c757d', lineHeight: '1.6' }}>
                    Your AI assistant is now ready to help customers 24/7. Monitor performance 
                    through our analytics dashboard and optimize as needed.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </Container>
      </Section>

      <CTASection>
        <Container>
          <motion.div variants={fadeInUp}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
              Ready to Transform Your Customer Support?
            </h2>
            <p style={{ fontSize: '1.2rem', marginBottom: '32px', opacity: 0.9 }}>
              Join thousands of businesses using TechSurf to provide better customer experiences.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button size="lg" variant="light" as="a" href="/demo">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" as="a" href="/docs">
                View Documentation
              </Button>
            </div>
          </motion.div>
        </Container>
      </CTASection>
    </>
  );
};

export default HomePage;
