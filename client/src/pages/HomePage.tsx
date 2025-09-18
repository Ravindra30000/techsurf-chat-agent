import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Brain, Globe, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

import Button from '../components/common/Button';
import Container from '../components/common/Container';
import Section from '../components/common/Section';
import Card from '../components/common/Card';
import CodeBlock from '../components/common/CodeBlock';

const HeroSection = styled(Section)`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.info});
  color: white;
  text-align: center;
  padding: 4rem 0;
`;

const HeroContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const HeroTitle = styled(motion.h1)`
  font-size: ${({ theme }) => theme.fontSizes['5xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: ${({ theme }) => theme.space.lg};
  line-height: ${({ theme }) => theme.lineHeights.tight};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes['4xl']};
  }
`;

const HeroSubtitle = styled(motion.p)`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  margin-bottom: ${({ theme }) => theme.space['2xl']};
  opacity: 0.9;
`;

const HeroButtons = styled(motion.div)`
  display: flex;
  gap: ${({ theme }) => theme.space.md};
  justify-content: center;
  flex-wrap: wrap;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.space.xl};
  margin-top: ${({ theme }) => theme.space['2xl']};
`;

const FeatureCard = styled(Card)`
  text-align: center;
  padding: ${({ theme }) => theme.space.xl};
`;

const FeatureIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: ${({ theme }) => theme.radii.xl};
  margin-bottom: ${({ theme }) => theme.space.lg};
`;

const DemoSection = styled(Section)`
  background: ${({ theme }) => theme.colors.gray[100]};
`;

const CodeDemo = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.space.lg};
  text-align: center;
`;

const StatCard = styled.div`
  background: white;
  padding: ${({ theme }) => theme.space.xl};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const StatNumber = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-top: ${({ theme }) => theme.space.xs};
`;

const HomePage: React.FC = () => {
  const integrationCode = `<!-- Add to any website -->
<script src="https://cdn.techsurf.ai/widget.js"></script>
<script>
  TechSurfChat.init({
    apiKey: 'your-api-key'
    // Contentstack auto-detected!
  });
</script>`;

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Intelligence',
      description: 'Smart query routing that knows when to fetch content from Contentstack vs provide general conversation.',
    },
    {
      icon: Zap,
      title: '5-Minute Integration',
      description: 'One line of code adds professional AI chat to any website. No complex setup or configuration needed.',
    },
    {
      icon: Globe,
      title: 'Universal Compatibility',
      description: 'Works with any website, framework, or CMS. Auto-detects your Contentstack configuration.',
    },
    {
      icon: DollarSign,
      title: 'Affordable Scaling',
      description: 'Start free, scale affordably. Enterprise features without enterprise prices.',
    },
  ];

  const stats = [
    { number: '< 5min', label: 'Setup Time' },
    { number: '99.9%', label: 'Uptime' },
    { number: '< 200ms', label: 'Response Time' },
    { number: '40%+', label: 'Conversion Boost' },
  ];

  return (
    <>
      <HeroSection>
        <Container>
          <HeroContent>
            <HeroTitle
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Universal AI Chat Widget for{' '}
              <span style={{ color: '#ffd700' }}>Contentstack</span>
            </HeroTitle>
            
            <HeroSubtitle
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Transform any website into an intelligent customer engagement platform. 
              One line of code, unlimited possibilities.
            </HeroSubtitle>

            <HeroButtons
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button
                as={Link}
                to="/demo"
                size="lg"
                variant="secondary"
                style={{ backgroundColor: 'white', color: '#007bff' }}
              >
                Try Live Demo
                <ArrowRight size={20} style={{ marginLeft: '8px' }} />
              </Button>
              
              <Button
                as={Link}
                to="/docs/getting-started"
                size="lg"
                variant="outline"
                style={{ borderColor: 'white', color: 'white' }}
              >
                Get Started
              </Button>
            </HeroButtons>
          </HeroContent>
        </Container>
      </HeroSection>

      <Section>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem' }}>
              Why Choose TechSurf?
            </h2>
            <p style={{ textAlign: 'center', fontSize: '1.25rem', color: '#6c757d', marginBottom: '3rem' }}>
              The only AI chat platform built specifically for Contentstack developers
            </p>
          </motion.div>

          <FeatureGrid>
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <FeatureCard>
                  <FeatureIcon>
                    <feature.icon size={24} />
                  </FeatureIcon>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
                    {feature.title}
                  </h3>
                  <p style={{ color: '#6c757d', lineHeight: '1.6' }}>
                    {feature.description}
                  </p>
                </FeatureCard>
              </motion.div>
            ))}
          </FeatureGrid>
        </Container>
      </Section>

      <DemoSection>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem' }}>
              Integration in Seconds
            </h2>
            <p style={{ textAlign: 'center', fontSize: '1.25rem', color: '#6c757d', marginBottom: '3rem' }}>
              Add intelligent customer support to any website with just two lines of code
            </p>

            <CodeDemo>
              <CodeBlock language="html" code={integrationCode} />
            </CodeDemo>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Button as={Link} to="/docs/integration" size="lg">
                View Full Documentation
              </Button>
            </div>
          </motion.div>
        </Container>
      </DemoSection>

      <Section>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem' }}>
              Built for Performance
            </h2>
            <p style={{ textAlign: 'center', fontSize: '1.25rem', color: '#6c757d', marginBottom: '3rem' }}>
              Enterprise-grade reliability with startup agility
            </p>
          </motion.div>

          <StatsGrid>
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <StatCard>
                  <StatNumber>{stat.number}</StatNumber>
                  <StatLabel>{stat.label}</StatLabel>
                </StatCard>
              </motion.div>
            ))}
          </StatsGrid>
        </Container>
      </Section>

      <Section style={{ background: '#f8f9fa' }}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center' }}
          >
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
              Ready to Get Started?
            </h2>
            <p style={{ fontSize: '1.25rem', color: '#6c757d', marginBottom: '2rem' }}>
              Join thousands of developers building better customer experiences with TechSurf
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button as={Link} to="/demo" size="lg">
                Try Free Demo
              </Button>
              <Button as={Link} to="/docs" size="lg" variant="outline">
                Read Documentation
              </Button>
            </div>
          </motion.div>
        </Container>
      </Section>
    </>
  );
};

export default HomePage;