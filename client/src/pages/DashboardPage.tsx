import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Star,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react';
import Container from '../components/common/Container';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.space.lg};
  margin-bottom: ${({ theme }) => theme.space.xl};
`;

const MetricCard = styled(Card)`
  padding: ${({ theme }) => theme.space.lg};
  text-align: center;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }

  .icon {
    width: 48px;
    height: 48px;
    margin: 0 auto ${({ theme }) => theme.space.md};
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primaryHover});
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .metric-value {
    font-size: ${({ theme }) => theme.fontSizes['3xl']};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.dark};
    display: block;
    margin-bottom: ${({ theme }) => theme.space.xs};
  }

  .metric-label {
    color: ${({ theme }) => theme.colors.gray};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    margin-bottom: ${({ theme }) => theme.space.sm};
  }

  .metric-change {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    padding: 2px 8px;
    border-radius: 12px;
    
    &.positive {
      background: ${({ theme }) => theme.colors.success}20;
      color: ${({ theme }) => theme.colors.success};
    }
    
    &.negative {
      background: ${({ theme }) => theme.colors.danger}20;
      color: ${({ theme }) => theme.colors.danger};
    }
  }
`;

const ChartContainer = styled(Card)`
  padding: ${({ theme }) => theme.space.xl};
  margin-bottom: ${({ theme }) => theme.space.xl};
  
  h3 {
    margin-bottom: ${({ theme }) => theme.space.lg};
    color: ${({ theme }) => theme.colors.dark};
  }
`;

const RecentConversations = styled(Card)`
  padding: ${({ theme }) => theme.space.xl};
  
  .conversation-item {
    display: flex;
    align-items: center;
    padding: ${({ theme }) => theme.space.md} 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray};
    
    &:last-child {
      border-bottom: none;
    }
    
    .avatar {
      width: 40px;
      height: 40px;
      background: ${({ theme }) => theme.colors.gray};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: ${({ theme }) => theme.space.md};
      font-weight: ${({ theme }) => theme.fontWeights.semibold};
      color: white;
    }
    
    .content {
      flex: 1;
      
      .user-name {
        font-weight: ${({ theme }) => theme.fontWeights.semibold};
        margin-bottom: 2px;
      }
      
      .message-preview {
        color: ${({ theme }) => theme.colors.gray};
        font-size: ${({ theme }) => theme.fontSizes.sm};
      }
    }
    
    .timestamp {
      color: ${({ theme }) => theme.colors.gray};
      font-size: ${({ theme }) => theme.fontSizes.xs};
    }
  }
`;

const TopNav = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.space.xl};
  
  h1 {
    margin: 0;
    color: ${({ theme }) => theme.colors.dark};
  }
  
  .actions {
    display: flex;
    gap: ${({ theme }) => theme.space.md};
  }
`;

interface DashboardData {
  totalConversations: number;
  activeChats: number;
  responseTime: string;
  satisfaction: number;
  conversationsChange: number;
  chatsChange: number;
  responseTimeChange: number;
  satisfactionChange: number;
}

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    totalConversations: 1247,
    activeChats: 23,
    responseTime: '2.1s',
    satisfaction: 4.8,
    conversationsChange: 12.5,
    chatsChange: -5.2,
    responseTimeChange: -8.3,
    satisfactionChange: 2.1
  });

  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock updated data
    setData(prev => ({
      ...prev,
      totalConversations: prev.totalConversations + Math.floor(Math.random() * 10),
      activeChats: Math.floor(Math.random() * 30) + 15,
    }));
    
    setIsLoading(false);
  };

  const recentConversations = [
    {
      id: 1,
      userName: 'Sarah Chen',
      message: 'Hi, I need help with your product pricing...',
      timestamp: '2 min ago',
      avatar: 'SC'
    },
    {
      id: 2,
      userName: 'Mike Johnson',
      message: 'Can you tell me about your return policy?',
      timestamp: '5 min ago',
      avatar: 'MJ'
    },
    {
      id: 3,
      userName: 'Emily Davis',
      message: 'I\'m having trouble with the integration...',
      timestamp: '12 min ago',
      avatar: 'ED'
    },
    {
      id: 4,
      userName: 'Anonymous',
      message: 'What are your business hours?',
      timestamp: '18 min ago',
      avatar: 'A'
    },
    {
      id: 5,
      userName: 'Tom Wilson',
      message: 'Great service! Thank you for the help.',
      timestamp: '25 min ago',
      avatar: 'TW'
    }
  ];

  return (
    <Container style={{ padding: '40px 20px' }}>
      <TopNav>
        <h1>📊 Dashboard</h1>
        <div className="actions">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            disabled={isLoading}
          >
            {isLoading ? <RefreshCw size={16} className="spinning" /> : <RefreshCw size={16} />}
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download size={16} /> Export
          </Button>
          <Button size="sm" as="a" href="/dashboard/settings">
            <Settings size={16} /> Settings
          </Button>
        </div>
      </TopNav>

      <DashboardGrid>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <MetricCard>
            <div className="icon">
              <MessageSquare size={24} />
            </div>
            <span className="metric-value">{data.totalConversations.toLocaleString()}</span>
            <div className="metric-label">Total Conversations</div>
            <span className={`metric-change ${data.conversationsChange > 0 ? 'positive' : 'negative'}`}>
              {data.conversationsChange > 0 ? '+' : ''}{data.conversationsChange}% this month
            </span>
          </MetricCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MetricCard>
            <div className="icon">
              <Users size={24} />
            </div>
            <span className="metric-value">{data.activeChats}</span>
            <div className="metric-label">Active Chats</div>
            <span className={`metric-change ${data.chatsChange > 0 ? 'positive' : 'negative'}`}>
              {data.chatsChange > 0 ? '+' : ''}{data.chatsChange}% vs last hour
            </span>
          </MetricCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <MetricCard>
            <div className="icon">
              <Clock size={24} />
            </div>
            <span className="metric-value">{data.responseTime}</span>
            <div className="metric-label">Avg Response Time</div>
            <span className={`metric-change ${data.responseTimeChange < 0 ? 'positive' : 'negative'}`}>
              {data.responseTimeChange}% faster
            </span>
          </MetricCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <MetricCard>
            <div className="icon">
              <Star size={24} />
            </div>
            <span className="metric-value">{data.satisfaction}/5</span>
            <div className="metric-label">Customer Satisfaction</div>
            <span className={`metric-change ${data.satisfactionChange > 0 ? 'positive' : 'negative'}`}>
              +{data.satisfactionChange}% this month
            </span>
          </MetricCard>
        </motion.div>
      </DashboardGrid>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ChartContainer>
            <h3>📈 Conversations Over Time</h3>
            <div style={{ 
              height: '300px', 
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6c757d',
              fontSize: '18px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <BarChart3 size={48} style={{ marginBottom: '16px' }} />
                <div>Interactive Chart Coming Soon</div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>
                  Integration with Recharts in progress
                </div>
              </div>
            </div>
          </ChartContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <RecentConversations>
            <h3 style={{ marginBottom: '24px', color: '#212529' }}>💬 Recent Conversations</h3>
            {recentConversations.map((conversation, index) => (
              <motion.div
                key={conversation.id}
                className="conversation-item"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <div className="avatar">{conversation.avatar}</div>
                <div className="content">
                  <div className="user-name">{conversation.userName}</div>
                  <div className="message-preview">{conversation.message}</div>
                </div>
                <div className="timestamp">{conversation.timestamp}</div>
              </motion.div>
            ))}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Button variant="outline" size="sm" as="a" href="/dashboard/conversations">
                View All Conversations
              </Button>
            </div>
          </RecentConversations>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '24px' 
        }}>
          <Card style={{ padding: '24px' }}>
            <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="#28a745" />
              Top Performing Content
            </h4>
            <div style={{ space: '12px 0' }}>
              {[
                { title: 'Product Pricing Guide', views: 234 },
                { title: 'Getting Started Tutorial', views: 187 },
                { title: 'API Documentation', views: 156 },
                { title: 'Troubleshooting FAQ', views: 142 }
              ].map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'between', 
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: index < 3 ? '1px solid #e9ecef' : 'none'
                }}>
                  <span style={{ fontSize: '14px' }}>{item.title}</span>
                  <span style={{ 
                    background: '#007bff20', 
                    color: '#007bff', 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {item.views}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding: '24px' }}>
            <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={20} color="#6c757d" />
              Quick Actions
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Button variant="outline" size="sm" as="a" href="/dashboard/widget-config">
                Configure Widget
              </Button>
              <Button variant="outline" size="sm" as="a" href="/dashboard/contentstack">
                Contentstack Settings
              </Button>
              <Button variant="outline" size="sm" as="a" href="/dashboard/analytics">
                Advanced Analytics
              </Button>
              <Button variant="outline" size="sm" as="a" href="/dashboard/api-keys">
                Manage API Keys
              </Button>
            </div>
          </Card>
        </div>
      </motion.div>
    </Container>
  );
};

export default DashboardPage;
