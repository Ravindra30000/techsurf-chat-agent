import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Menu, X, MessageCircle, BarChart3, Book } from 'lucide-react';

import Container from './Container';
import Button from './Button';

const HeaderWrapper = styled.header`
  background: white;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  position: sticky;
  top: 0;
  z-index: 100;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space.md} 0;
  position: relative;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

const NavLinks = styled.div<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid ${({ theme }) => theme.colors.gray[200]};
    border-top: none;
    flex-direction: column;
    padding: ${({ theme }) => theme.space.lg};
    transform: ${({ isOpen }) => isOpen ? 'translateY(0)' : 'translateY(-100%)'};
    opacity: ${({ isOpen }) => isOpen ? 1 : 0};
    visibility: ${({ isOpen }) => isOpen ? 'visible' : 'hidden'};
    transition: all 0.2s ease-in-out;
  }
`;

const NavLink = styled(Link)<{ isActive: boolean }>`
  color: ${({ isActive, theme }) => 
    isActive ? theme.colors.primary : theme.colors.gray[600]};
  text-decoration: none;
  font-weight: ${({ isActive, theme }) => 
    isActive ? theme.fontWeights.medium : theme.fontWeights.normal};
  transition: color 0.2s ease-in-out;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.xs};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    gap: ${({ theme }) => theme.space.sm};
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.gray[600]};
  cursor: pointer;
  padding: ${({ theme }) => theme.space.xs};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <HeaderWrapper>
      <Container>
        <Nav>
          <Logo to="/">
            <MessageCircle size={24} />
            TechSurf Chat
          </Logo>

          <NavLinks isOpen={isMobileMenuOpen}>
            <NavLink to="/" isActive={isActive('/')}>
              Home
            </NavLink>
            <NavLink to="/demo" isActive={isActive('/demo')}>
              Demo
            </NavLink>
            <NavLink to="/dashboard" isActive={isActive('/dashboard')}>
              <BarChart3 size={16} />
              Dashboard
            </NavLink>
            <NavLink to="/docs" isActive={isActive('/docs')}>
              <Book size={16} />
              Docs
            </NavLink>
          </NavLinks>

          <NavActions>
            <Button
              as={Link}
              to="/demo"
              size="sm"
              variant="outline"
            >
              Try Demo
            </Button>
            <Button
              as={Link}
              to="/docs/getting-started"
              size="sm"
            >
              Get Started
            </Button>

            <MobileMenuButton onClick={toggleMobileMenu}>
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </MobileMenuButton>
          </NavActions>
        </Nav>
      </Container>
    </HeaderWrapper>
  );
};

export default Header;