import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { childDashboardApi } from '../../services/api';
import { StudyPlan } from '../../types/studyPlan';
import { Achievement } from '../../types/activity';
import SessionManager from './SessionManager';
import { useMobileOptimizations } from '../../hooks/useMobileOptimizations';
import { ResponsiveChildDashboard } from '../mobile/ResponsiveChildDashboard';
import { LoadingState } from '../common/LoadingState';
import { ErrorState } from '../common/ErrorState';
import { ChildFriendlyErrorDisplay } from '../common/ChildFriendlyErrorDisplay';
import '../../styles/mobileOptimizations.css';

// Enhanced dashboard data interfaces
interface DashboardData {
  child: {
    id: string;
  };
  progressSummary: {
    totalActivities: number;
    completedActivities: number;
    inProgressActivities: number;
    totalTimeSpent: number;
    averageScore: number;
    currentDailyStreak: number;
    longestDailyStreak: number;
    lastActivityDate: Date | null;
    weeklyGoalProgress: number;
    monthlyGoalProgress: number;
  };
  activeActivities: any[];
  currentStreaks: Array<{
    id: string;
    streakType: string;
    currentCount: number;
    longestCount: number;
    isActive: boolean;
    lastActivityDate: Date | null;
  }>;
  studyPlans: Array<StudyPlan & {
    totalActivities: number;
    completedActivities: number;
    progressPercentage: number;
  }>;
  badges: {
    recent: Achievement[];
    progress: any[];
    nextToEarn: any[];
  };
  dailyGoals: {
    activitiesTarget: number;
    activitiesCompleted: number;
    timeTarget: number;
    timeSpent: number;
  };
}

const ChildDashboard: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading: authLoading, isChild, lastError, clearError } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [retryCount, setRetryCount] = useState(0);
  const { isTablet, screenSize } = useMobileOptimizations();

  // Use responsive dashboard for tablets and mobile devices
  const useResponsiveDashboard = isTablet || screenSize === 'small';

  // Authentication state checks
  useEffect(() => {
    // If authentication is still loading, wait
    if (authLoading) {
      return;
    }

    // If not authenticated, redirect to child login
    if (!isAuthenticated) {
      console.log('Child dashboard: User not authenticated, redirecting to login');
      navigate('/child-login', { replace: true });
      return;
    }

    // If authenticated but not a child user, redirect to parent dashboard
    if (!isChild) {
      console.log('Child dashboard: User is not a child, redirecting to parent dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }

    // If user data is missing, try to refresh authentication
    if (!user?.id) {
      console.log('Child dashboard: User data missing, attempting to refresh auth');
      // This will be handled by the AuthContext
      return;
    }

    console.log('Child dashboard: Authentication verified for child user:', user.id);
  }, [authLoading, isAuthenticated, isChild, user, navigate]);

  // Handle authentication errors
  useEffect(() => {
    if (lastError) {
      console.error('Child dashboard: Authentication error detected:', lastError);
      setError(lastError.userFriendlyMessage);
      
      // Auto-clear error after 5 seconds
      const timer = setTimeout(() => {
        clearError();
        setError('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [lastError, clearError]);

  // Real-time data fetching
  const fetchDashboardData = useCallback(async () => {
    try {
      // Don't fetch if authentication is still loading
      if (authLoading) {
        return;
      }

      // Don't fetch if not authenticated or not a child
      if (!isAuthenticated || !isChild || !user?.id) {
        console.log('Child dashboard: Skipping data fetch - authentication not ready');
        return;
      }

      console.log('Child dashboard: Fetching data for user:', user.id);
      setError(''); // Clear any previous errors

      // Fetch dashboard data from the child API
      const dashboardData = await childDashboardApi.getDashboard(user.id);
      setDashboardData(dashboardData);
      setLastUpdate(new Date());
      setRetryCount(0); // Reset retry count on success
      console.log('Child dashboard: Data fetched successfully');
    } catch (err: any) {
      console.error('Dashboard API failed:', err);
      
      // Handle authentication errors
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('Child dashboard: Authentication error, redirecting to login');
        navigate('/child-login', { replace: true });
        return;
      }

      // For other errors, use mock data for development but show a warning
      console.warn('Dashboard API failed, using mock data for development');
      
      const mockData = {
        child: { id: user?.id || 'mock-id' },
        progressSummary: {
          totalActivities: 20,
          completedActivities: 14,
          inProgressActivities: 3,
          totalTimeSpent: 2400, // 40 minutes in seconds
          averageScore: 85,
          currentDailyStreak: 5,
          longestDailyStreak: 12,
          lastActivityDate: new Date(),
          weeklyGoalProgress: 70,
          monthlyGoalProgress: 45
        },
        activeActivities: [],
        currentStreaks: [
          {
            id: '1',
            streakType: 'DAILY',
            currentCount: 5,
            longestCount: 12,
            isActive: true,
            lastActivityDate: new Date()
          }
        ],
        studyPlans: [
          {
            id: '1',
            childId: user?.id || 'mock-id',
            subject: 'Mathematics',
            grade: '5th Grade',
            difficulty: 'intermediate' as const,
            objectives: ['Basic arithmetic', 'Problem solving'],
            estimatedDuration: 30,
            createdAt: new Date(),
            updatedAt: new Date(),
            totalActivities: 10,
            completedActivities: 7,
            progressPercentage: 70,
            status: 'active' as const
          },
          {
            id: '2',
            childId: user?.id || 'mock-id',
            subject: 'Science',
            grade: '5th Grade',
            difficulty: 'beginner' as const,
            objectives: ['Basic concepts', 'Experiments'],
            estimatedDuration: 25,
            createdAt: new Date(),
            updatedAt: new Date(),
            totalActivities: 8,
            completedActivities: 5,
            progressPercentage: 62.5,
            status: 'active' as const
          }
        ],
        badges: {
          recent: [
            {
              id: '1',
              title: 'First Steps',
              description: 'Completed your first activity',
              iconUrl: '🏅',
              type: 'badge' as const,
              earnedAt: new Date(),
              isNew: true
            },
            {
              id: '2',
              title: 'Math Wizard',
              description: 'Completed 5 math activities',
              iconUrl: '🧙‍♂️',
              type: 'badge' as const,
              earnedAt: new Date(),
              isNew: false
            }
          ],
          progress: [],
          nextToEarn: [
            {
              badgeId: 'daily_learner',
              currentValue: 5,
              targetValue: 7,
              progressPercentage: 71,
              estimatedTimeToCompletion: '2 more days'
            }
          ]
        },
        dailyGoals: {
          activitiesTarget: 5,
          activitiesCompleted: 3,
          timeTarget: 1800, // 30 minutes
          timeSpent: 1200 // 20 minutes
        }
      };
      
      setDashboardData(mockData);
      setLastUpdate(new Date());
      
      // Show a friendly message about using demo data
      if (retryCount < 3) {
        setError('Having trouble connecting. Using demo data for now! 🌟');
        setRetryCount(prev => prev + 1);
      } else {
        setError('');
      }
    }
  }, [user?.id, authLoading, isAuthenticated, isChild, navigate, retryCount]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchDashboardData();
      setIsLoading(false);
    };

    loadData();
  }, [fetchDashboardData]);

  // Real-time updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleLogout = async () => {
    try {
      console.log('Child dashboard: Initiating logout');
      await logout();
      // Navigation will be handled by the AuthContext and routing logic
    } catch (err) {
      console.error('Logout failed:', err);
      // Force navigation even if logout API fails
      navigate('/child-login', { replace: true });
    }
  };

  const handleStartActivity = (activityId: string) => {
    navigate(`/child/activity/${activityId}`);
  };

  const handleStudyPlanSelect = (planId: string) => {
    navigate(`/child/study-plan/${planId}`);
  };

  const handleSettingsOpen = () => {
    navigate('/child/settings');
  };

  const handleHelpRequest = () => {
    navigate('/child/help');
  };

  // Component for learning streak display with fire animation
  const LearningStreakDisplay: React.FC<{ streaks: DashboardData['currentStreaks'] }> = ({ streaks }) => {
    const dailyStreak = streaks.find(s => s.streakType === 'DAILY');
    const currentStreak = dailyStreak?.currentCount || 0;
    const longestStreak = dailyStreak?.longestCount || 0;

    return (
      <div style={{
        background: 'linear-gradient(135deg, #ff6b6b, #ffa500)',
        borderRadius: '12px',
        padding: '20px',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '8px',
          animation: currentStreak > 0 ? 'fireFlicker 1.5s ease-in-out infinite alternate' : 'none'
        }}>
          🔥
        </div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '4px'
        }}>
          Learning Streak
        </h3>
        <div style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
        </div>
        <div style={{
          fontSize: '14px',
          opacity: 0.9
        }}>
          Best: {longestStreak} days
        </div>
        
        {/* Fire animation styles */}
        <style>{`
          @keyframes fireFlicker {
            0% { transform: scale(1) rotate(-2deg); }
            50% { transform: scale(1.1) rotate(1deg); }
            100% { transform: scale(1.05) rotate(-1deg); }
          }
        `}</style>
      </div>
    );
  };

  // Component for daily goals widget
  const DailyGoalsWidget: React.FC<{ goals: DashboardData['dailyGoals'] }> = ({ goals }) => {
    const activityProgress = Math.min((goals.activitiesCompleted / goals.activitiesTarget) * 100, 100);
    const timeProgress = Math.min((goals.timeSpent / goals.timeTarget) * 100, 100);

    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center'
        }}>
          🎯 Today's Goals
        </h3>
        
        {/* Activities Goal */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '14px', color: '#4b5563' }}>Activities</span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
              {goals.activitiesCompleted}/{goals.activitiesTarget}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${activityProgress}%`,
              height: '100%',
              backgroundColor: activityProgress >= 100 ? '#10b981' : '#3b82f6',
              borderRadius: '4px',
              transition: 'all 0.3s ease'
            }} />
          </div>
        </div>

        {/* Time Goal */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '14px', color: '#4b5563' }}>Learning Time</span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
              {Math.floor(goals.timeSpent / 60)}m/{Math.floor(goals.timeTarget / 60)}m
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${timeProgress}%`,
              height: '100%',
              backgroundColor: timeProgress >= 100 ? '#10b981' : '#8b5cf6',
              borderRadius: '4px',
              transition: 'all 0.3s ease'
            }} />
          </div>
        </div>

        {/* Completion message */}
        {activityProgress >= 100 && timeProgress >= 100 && (
          <div style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: '#dcfce7',
            borderRadius: '6px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#166534',
            fontWeight: '500'
          }}>
            🎉 Great job! You've completed today's goals!
          </div>
        )}
      </div>
    );
  };

  // Component for quick statistics panel
  const QuickStatsPanel: React.FC<{ summary: DashboardData['progressSummary'] }> = ({ summary }) => {
    const stats = [
      {
        label: 'Completed',
        value: summary.completedActivities,
        icon: '✅',
        color: '#10b981'
      },
      {
        label: 'In Progress',
        value: summary.inProgressActivities,
        icon: '⏳',
        color: '#f59e0b'
      },
      {
        label: 'Avg Score',
        value: `${Math.round(summary.averageScore)}%`,
        icon: '⭐',
        color: '#8b5cf6'
      },
      {
        label: 'Time Today',
        value: `${Math.floor(summary.totalTimeSpent / 60)}m`,
        icon: '⏰',
        color: '#06b6d4'
      }
    ];

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px'
      }}>
        {stats.map((stat, index) => (
          <div key={index} style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: `2px solid ${stat.color}20`
          }}>
            <div style={{
              fontSize: '24px',
              marginBottom: '4px'
            }}>
              {stat.icon}
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: stat.color,
              marginBottom: '2px'
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6b7280'
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Component for study plan progress cards
  const StudyPlanProgressCard: React.FC<{ plan: DashboardData['studyPlans'][0] }> = ({ plan }) => {
    const progressPercentage = plan.progressPercentage || 0;
    
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '20px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '160px'
      }}>
        {/* Background pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          transform: 'translate(30px, -30px)'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            {plan.subject}
          </h3>
          
          <p style={{
            fontSize: '14px',
            opacity: 0.9,
            marginBottom: '16px'
          }}>
            {plan.completedActivities}/{plan.totalActivities} activities completed
          </p>

          {/* Visual progress indicator */}
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '3px',
            marginBottom: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressPercentage}%`,
              height: '100%',
              backgroundColor: '#fbbf24',
              borderRadius: '3px',
              transition: 'width 0.5s ease'
            }} />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {Math.round(progressPercentage)}% Complete
            </span>
            
            <button
              onClick={() => handleStartActivity(plan.id)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show loading state while authentication or dashboard data is loading
  if (authLoading || isLoading || !dashboardData) {
    const loadingMessage = authLoading 
      ? 'Checking your login...' 
      : 'Loading your learning adventure...';
    
    return (
      <LoadingState 
        message={loadingMessage}
        icon="🚀"
        showProgress={true}
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      />
    );
  }

  // Show error state if there's an authentication error that requires user action
  if (lastError && lastError.shouldRedirect) {
    return (
      <ChildFriendlyErrorDisplay
        error={lastError}
        onRetry={() => {
          clearError();
          window.location.reload();
        }}
        onGoHome={() => {
          clearError();
          navigate('/child-login');
        }}
      />
    );
  }

  // Use responsive dashboard for mobile/tablet devices
  if (useResponsiveDashboard) {
    const profile = {
      id: dashboardData.child.id,
      name: user?.firstName || 'Explorer',
      avatar: user?.avatar,
      grade: '5th Grade', // This should come from user data
      currentStreak: dashboardData.progressSummary.currentDailyStreak,
      totalBadges: dashboardData.badges.recent.length,
      weeklyGoal: dashboardData.dailyGoals.activitiesTarget * 7,
      weeklyProgress: dashboardData.progressSummary.weeklyGoalProgress
    };

    const studyPlans = dashboardData.studyPlans.map(plan => ({
      id: plan.id,
      title: plan.subject,
      subject: plan.subject,
      progress: plan.progressPercentage,
      totalActivities: plan.totalActivities,
      completedActivities: plan.completedActivities,
      nextActivity: plan.completedActivities < plan.totalActivities ? {
        id: `${plan.id}-next`,
        title: `Continue ${plan.subject}`,
        type: 'reading' as const
      } : undefined
    }));

    const recentAchievements = dashboardData.badges.recent.map(badge => ({
      id: badge.id,
      title: badge.title,
      description: badge.description,
      icon: badge.iconUrl || '🏅',
      earnedAt: badge.earnedAt || new Date(),
      isNew: badge.isNew || false
    }));

    return (
      <>
        <SessionManager inactivityTimeout={20 * 60 * 1000} />
        <ResponsiveChildDashboard
          profile={profile}
          studyPlans={studyPlans}
          recentAchievements={recentAchievements}
          onActivityStart={handleStartActivity}
          onStudyPlanSelect={handleStudyPlanSelect}
          onSettingsOpen={handleSettingsOpen}
          onHelpRequest={handleHelpRequest}
        />
      </>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* Session Manager for inactivity detection */}
      <SessionManager inactivityTimeout={20 * 60 * 1000} /> {/* 20 minutes */}
      
      <header style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        padding: '16px 0',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '24px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Study Adventure</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <span style={{
              fontSize: '16px',
              fontWeight: '500',
              color: '#4b5563'
            }}>
              Hi, {user?.firstName || 'Explorer'}! 👋
            </span>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              textAlign: 'right'
            }}>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '24px 16px'
      }}>
        {error && (
          <div style={{
            marginBottom: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #fbbf24',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
            <p style={{ 
              color: '#92400e', 
              fontSize: '16px', 
              fontWeight: '500',
              margin: '0 0 12px 0'
            }}>
              {error}
            </p>
            {retryCount < 3 && (
              <button
                onClick={() => {
                  setError('');
                  fetchDashboardData();
                }}
                style={{
                  backgroundColor: '#fbbf24',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f59e0b';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#fbbf24';
                }}
              >
                Try Again 🔄
              </button>
            )}
          </div>
        )}

        {/* Top Row: Streak, Daily Goals, and Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <LearningStreakDisplay streaks={dashboardData.currentStreaks} />
          <DailyGoalsWidget goals={dashboardData.dailyGoals} />
          <QuickStatsPanel summary={dashboardData.progressSummary} />
        </div>

        {/* Study Plans Section */}
        <div style={{
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '20px',
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>Your Learning Adventures</h2>
          
          {dashboardData.studyPlans.length === 0 ? (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              padding: '48px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                fontSize: '64px',
                marginBottom: '16px'
              }}>🔍</div>
              <p style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#4b5563',
                marginBottom: '8px'
              }}>No active adventures yet!</p>
              <p style={{
                color: '#6b7280',
                fontSize: '16px'
              }}>Ask your parent to create a study plan for you.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px'
            }}>
              {dashboardData.studyPlans.map((plan) => (
                <StudyPlanProgressCard key={plan.id} plan={plan} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Achievements Section */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937'
            }}>🏆 Recent Achievements</h2>
            <button 
              onClick={() => navigate('/child/achievements')}
              style={{
                fontSize: '14px',
                color: '#667eea',
                fontWeight: '500',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#4f46e5';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#667eea';
              }}
            >
              View All →
            </button>
          </div>
          
          {dashboardData.badges.recent.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '16px'
            }}>
              {dashboardData.badges.recent.slice(0, 6).map((achievement) => (
                <div 
                  key={achievement.id} 
                  style={{
                    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                    border: '2px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    fontSize: '32px',
                    marginBottom: '8px'
                  }}>
                    {achievement.iconUrl || '🏅'}
                  </div>
                  <p style={{
                    fontWeight: '600',
                    color: '#92400e',
                    fontSize: '14px',
                    marginBottom: '4px'
                  }}>
                    {achievement.title}
                  </p>
                  <p style={{
                    fontSize: '11px',
                    color: '#a16207',
                    lineHeight: '1.3'
                  }}>
                    {achievement.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '32px 0'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px'
              }}>🎯</div>
              <p style={{
                fontSize: '18px',
                fontWeight: '500',
                color: '#4b5563',
                marginBottom: '8px'
              }}>Start your achievement journey!</p>
              <p style={{
                color: '#6b7280'
              }}>Complete activities to earn your first badges and rewards.</p>
            </div>
          )}
        </div>

        {/* Next Badges to Earn */}
        {dashboardData.badges.nextToEarn.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '16px'
            }}>🎯 Next Badges to Earn</h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {dashboardData.badges.nextToEarn.slice(0, 3).map((badge, index) => (
                <div key={index} style={{
                  backgroundColor: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#4b5563'
                    }}>
                      Badge Progress
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {Math.round(badge.progressPercentage)}%
                    </span>
                  </div>
                  
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '3px',
                    marginBottom: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${badge.progressPercentage}%`,
                      height: '100%',
                      backgroundColor: '#10b981',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  
                  <p style={{
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    {badge.currentValue}/{badge.targetValue} {badge.estimatedTimeToCompletion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChildDashboard;