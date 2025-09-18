import React from 'react';
import styled from 'styled-components';
import { Github, Twitter, Linkedin, MessageCircle } from 'lucide-react';

import Container from './Container';

const FooterWrapper = styled.footer`
  background: ${({ theme }) => theme.colors.dark};
  color: white;
  padding: ${({ theme }) => theme.space['2xl']} 0 ${({ theme }) => theme.space.lg};
`;

const FooterContent = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.space.xl};
  margin-bottom: ${({ theme }) => theme.space.xl};
`;

const FooterSection = styled.div`
  h3 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    margin-bottom: ${({ theme }) => theme.space.md};
    color: white;
  }

  p, a {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.gray[300]};
    line-height: ${({ theme }) => theme.lineHeights.relaxed};
  }

  a {
    text-decoration: none;
    transition: color 0.2s ease-in-out;

    &:hover {
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const LinkList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    margin-bottom: ${({ theme }) => theme.space.sm};
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.md};
  margin-top: ${({ theme }) => theme.space.md};

  a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: ${({ theme }) => theme.colors.gray[800]};
    border-radius: ${({ theme }) => theme.radii.md};
    color: ${({ theme }) => theme.colors.gray[300]};
    transition: all 0.2s ease-in-out;

    &:hover {
      background: ${({ theme }) => theme.colors.primary};
      color: white;
    }
  }
`;

const FooterBottom = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[700]};
  padding-top: ${({ theme }) => theme.space.lg};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.md};

  p {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.gray[400]};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    text-align: center;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary};
`;

const Footer: React.FC = () => {
  return (
    <FooterWrapper>
      <Container>
        <FooterContent>
          <FooterSection>
            <Logo>
              <MessageCircle size={24} />
              TechSurf Chat
            </Logo>
            <p style={{ marginTop: '1rem' }}>
              Universal AI-powered chat widget platform with Contentstack integration. 
              Transform any website into an intelligent customer engagement platform in minutes.
            </p>
            <SocialLinks>
              <a href="https://github.com" aria-label="GitHub">
                <Github size={20} />
              </a>
              <a href="https://twitter.com" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
            </SocialLinks>
          </FooterSection>

          <FooterSection>
            <h3>Product</h3>
            <LinkList>
              <li><a href="/demo">Live Demo</a></li>
              <li><a href="/features">Features</a></li>
              <li><a href="/pricing">Pricing</a></li>
              <li><a href="/integrations">Integrations</a></li>
              <li><a href="/enterprise">Enterprise</a></li>
            </LinkList>
          </FooterSection>

          <FooterSection>
            <h3>Developers</h3>
            <LinkList>
              <li><a href="/docs">Documentation</a></li>
              <li><a href="/docs/api">API Reference</a></li>
              <li><a href="/docs/sdk">SDK Guide</a></li>
              <li><a href="/examples">Examples</a></li>
              <li><a href="/changelog">Changelog</a></li>
            </LinkList>
          </FooterSection>

          <FooterSection>
            <h3>Company</h3>
            <LinkList>
              <li><a href="/about">About</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/careers">Careers</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/support">Support</a></li>
            </LinkList>
          </FooterSection>
        </FooterContent>

        <FooterBottom>
          <p>&copy; 2025 TechSurf Chat Platform. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <a href="/privacy" style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              Privacy Policy
            </a>
            <a href="/terms" style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              Terms of Service
            </a>
            <a href="/cookies" style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              Cookie Policy
            </a>
          </div>
        </FooterBottom>
      </Container>
    </FooterWrapper>
  );
};

export default Footer;