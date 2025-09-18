import React from 'react';
import styled from 'styled-components';
import { BarChart3, Users, MessageSquare, TrendingUp, Eye, Clock } from 'lucide-react';

import Container from '../components/common/Container';
import Section from '../components/common/Section';
import Card from '../components/common/Card';

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.space.lg};
  margin-bottom: ${({ theme }) => theme.space['2xl']};
`;

const StatCard = styled(Card)`
  padding: ${({ theme }) => theme.space.xl};
  text-align: left;
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.space.md};
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.dark};
  margin-bottom: ${({ theme }) => theme.space.xs};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const StatChange = styled.div<{ positive: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ positive, theme }) => positive ? theme.colors.success : theme.colors.danger};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const ChartContainer = styled(Card)`
  padding: ${({ theme }) => theme.space.xl};
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.gray[50]};
  margin-bottom: ${({ theme }) => theme.space.xl};
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.md};
  background: white;
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const ActivityIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[600]};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ActivityContent = styled.div`
  flex: 1;

  h4 {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.dark};
    margin-bottom: ${({ theme }) => theme.space.xs};
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.gray[600]};
  }
`;

const DashboardPage: React.FC = () => {
  const stats = [
    {
      icon: MessageSquare,
      label: 'Total Conversations',
      value: '12,459',
      change: '+23% from last month',
      positive: true,
    },
    {
      icon: Users,
      label: 'Active Websites',
      value: '247',
      change: '+12% from last month',
      positive: true,
    },
    {
      icon: TrendingUp,
      label: 'Avg. Response Time',
      value: '180ms',
      change: '-15ms from last month',
      positive: true,
    },
    {
      icon: Eye,
      label: 'Widget Impressions',
      value: '89,234',
      change: '+34% from last month',
      positive: true,
    },
  ];

  const recentActivity = [
    {
      icon: MessageSquare,
      title: 'New conversation started',
      description: 'User from techsurf-demo.com asked about pricing',
      time: '2 minutes ago',
    },
    {
      icon: TrendingUp,
      title: 'High engagement detected',
      description: 'Widget on shop.example.com showing 95% satisfaction',
      time: '15 minutes ago',
    },
    {
      icon: Users,
      title: 'New website connected',
      description: 'blog.startup.ai integrated TechSurf widget',
      time: '1 hour ago',
    },
    {
      icon: Clock,
      title: 'Performance milestone',
      description: 'Average response time improved to 180ms',
      time: '3 hours ago',
    },
  ];

  return (
    <>
      <Section style={{ paddingTop: '2rem' }}>
        <Container>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Dashboard
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#6c757d' }}>
              Monitor your AI chat widget performance and analytics
            </p>
          </div>

          <StatsGrid>
            {stats.map((stat, index) => (
              <StatCard key={index}>
                <StatHeader>
                  <div>
                    <StatValue>{stat.value}</StatValue>
                    <StatLabel>{stat.label}</StatLabel>
                    <StatChange positive={stat.positive}>
                      {stat.change}
                    </StatChange>
                  </div>
                  <StatIcon>
                    <stat.icon size={24} />
                  </StatIcon>
                </StatHeader>
              </StatCard>
            ))}
          </StatsGrid>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                <BarChart3 size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Conversation Analytics
              </h2>
              <ChartContainer>
                <div style={{ textAlign: 'center', color: '#6c757d' }}>
                  <BarChart3 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>Interactive charts will be displayed here</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Real-time conversation metrics, response times, and satisfaction scores
                  </p>
                </div>
              </ChartContainer>
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                Recent Activity
              </h2>
              <ActivityList>
                {recentActivity.map((activity, index) => (
                  <ActivityItem key={index}>
                    <ActivityIcon>
                      <activity.icon size={18} />
                    </ActivityIcon>
                    <ActivityContent>
                      <h4>{activity.title}</h4>
                      <p>{activity.description}</p>
                      <p style={{ marginTop: '4px', fontStyle: 'italic' }}>
                        {activity.time}
                      </p>
                    </ActivityContent>
                  </ActivityItem>
                ))}
              </ActivityList>
            </div>
          </div>

          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Ready to Scale Your Customer Support?
            </h3>
            <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
              Your AI chat widget is performing great! Consider upgrading to handle more conversations.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                Upgrade Plan
              </button>
              <button 
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: 'transparent', 
                  color: '#007bff', 
                  border: '1px solid #007bff', 
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                View Analytics
              </button>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
};

export default DashboardPage;