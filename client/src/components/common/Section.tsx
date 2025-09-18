import styled from 'styled-components';

const Section = styled.section`
  padding: ${({ theme }) => theme.space['2xl']} 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.space.xl} 0;
  }
`;

export default Section;