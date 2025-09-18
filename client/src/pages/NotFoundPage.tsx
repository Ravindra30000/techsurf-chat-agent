import React from 'react';
import styled from 'styled-components';
import { AlertTriangle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

import Container from '../components/common/Container';
import Section from '../components/common/Section';
import Button from '../components/common/Button';

const NotFoundContainer = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.space['4xl']} 0;
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const ErrorIcon = styled.div`
  font-size: 8rem;
  color: ${({ theme }) => theme.colors.gray[300]};
  margin-bottom: ${({ theme }) => theme.space.xl};
`;

const ErrorCode = styled.h1`
  font-size: 6rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
  line-height: 1;
`;

const ErrorTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.dark};
  margin: ${({ theme }) => theme.space.lg} 0 ${({ theme }) => theme.space.md};
`;

const ErrorDescription = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: ${({ theme }) => theme.space['2xl']};
  max-width: 500px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.md};
  flex-wrap: wrap;
  justify-content: center;
`;

const HelpfulLinks = styled.div`
  margin-top: ${({ theme }) => theme.space['2xl']};
  padding-top: ${({ theme }) => theme.space.xl};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};

  h3 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.dark};
    margin-bottom: ${({ theme }) => theme.space.md};
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: ${({ theme }) => theme.space.md};
    max-width: 600px;
    margin: 0 auto;
  }

  li {
    text-align: left;
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    font-size: ${({ theme }) => theme.fontSizes.sm};

    &:hover {
      text-decoration: underline;
    }
  }
`;

const NotFoundPage: React.FC = () => {
  return (
    <Section>
      <Container>
        <NotFoundContainer>
          <ErrorIcon>
            <AlertTriangle size={120} />
          </ErrorIcon>
          
          <ErrorCode>404</ErrorCode>
          
          <ErrorTitle>Oops! Page Not Found</ErrorTitle>
          
          <ErrorDescription>
            The page you're looking for doesn't exist. It might have been moved, 
            deleted, or you might have typed the wrong URL.
          </ErrorDescription>
          
          <ActionButtons>
            <Button as={Link} to="/" size="lg">
              <Home size={20} />
              Go Home
            </Button>
            <Button as={Link} to="/demo" size="lg" variant="outline">
              Try Demo
            </Button>
          </ActionButtons>

          <HelpfulLinks>
            <h3>Helpful Links</h3>
            <ul>
              <li><a href="/">🏠 Home</a></li>
              <li><a href="/demo">🚀 Live Demo</a></li>
              <li><a href="/docs">📚 Documentation</a></li>
              <li><a href="/docs/getting-started">⚡ Quick Start</a></li>
              <li><a href="/dashboard">📊 Dashboard</a></li>
              <li><a href="/contact">💬 Contact Support</a></li>
            </ul>
          </HelpfulLinks>
        </NotFoundContainer>
      </Container>
    </Section>
  );
};

export default NotFoundPage;