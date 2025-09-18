import React from 'react';
import styled from 'styled-components';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

const CodeContainer = styled.div`
  position: relative;
  margin: ${({ theme }) => theme.space.md} 0;
`;

const CodeHeader = styled.div`
  background: ${({ theme }) => theme.colors.gray[800]};
  color: white;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  border-radius: ${({ theme }) => theme.radii.md} ${({ theme }) => theme.radii.md} 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Pre = styled.pre`
  background: ${({ theme }) => theme.colors.gray[900]};
  color: ${({ theme }) => theme.colors.gray[100]};
  padding: ${({ theme }) => theme.space.md};
  border-radius: ${({ title }: { title?: string }) => title ? '0 0 0.5rem 0.5rem' : '0.5rem'};
  overflow-x: auto;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  margin: 0;

  code {
    background: none;
    padding: 0;
    color: inherit;
    font-size: inherit;
  }
`;

const CopyButton = styled.button`
  background: ${({ theme }) => theme.colors.gray[700]};
  color: white;
  border: none;
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  cursor: pointer;
  transition: background 0.2s ease-in-out;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[600]};
  }
`;

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'text', title }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <CodeContainer>
      {title && (
        <CodeHeader>
          <span>{title}</span>
          <CopyButton onClick={handleCopy}>Copy</CopyButton>
        </CodeHeader>
      )}
      <Pre title={title}>
        <code>{code}</code>
      </Pre>
    </CodeContainer>
  );
};

export default CodeBlock;