import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: '#3b82f6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              📚
            </div>
            <span style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b'
            }}>
              Study Plan Pro
            </span>
          </div>
          
          <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <a href="#features" style={{
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}>Features</a>
            <a href="#pricing" style={{
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}>Pricing</a>
            <a href="#about" style={{
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}>About</a>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link to="/login" style={{
                color: '#64748b',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}>Parent Sign In</Link>
              <Link to="/child-login" style={{
                background: '#10b981',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}>Child Login 👦👧</Link>
              <Link to="/register" style={{
                background: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}>Get Started</Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '80px',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '800',
              lineHeight: '1.1',
              color: '#0f172a',
              margin: '0 0 24px 0'
            }}>
              Organize Your <br />
              <span style={{ color: '#3b82f6' }}>Family's Learning</span> <br />
              Journey
            </h1>
            
            <p style={{
              fontSize: '18px',
              color: '#64748b',
              lineHeight: '1.6',
              margin: '0 0 40px 0',
              maxWidth: '480px'
            }}>
              Create personalized study plans, track progress, and celebrate 
              achievements together. The complete family education 
              management platform.
            </p>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
              <Link to="/register" style={{
                background: '#3b82f6',
                color: 'white',
                padding: '14px 28px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
              }}>
                Start Free Trial
              </Link>
              <Link to="/child-login" style={{
                background: '#10b981',
                color: 'white',
                padding: '14px 28px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}>
                Child Login 🎓
              </Link>
            </div>
            
            <div style={{
              fontSize: '14px',
              color: '#94a3b8',
              margin: '0',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#475569' }}>
                🎯 Try it now with test accounts:
              </p>
              <p style={{ margin: '0 0 4px 0' }}>
                <strong>Parent:</strong> test@example.com / password123
              </p>
              <p style={{ margin: '0' }}>
                <strong>Child:</strong> testchild / PIN: 1234
              </p>
            </div>
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '24px',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px'
            }}>
              📚
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0'
            }}>
              Family Learning Dashboard
            </h3>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        padding: '80px 24px',
        background: 'white'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#3b82f6',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 16px 0'
          }}>
            FEATURES
          </p>
          
          <h2 style={{
            fontSize: '36px',
            fontWeight: '800',
            color: '#0f172a',
            margin: '0 0 16px 0'
          }}>
            Everything you need for family learning
          </h2>
          
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            margin: '0 0 64px 0',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Comprehensive tools to organize, track, and celebrate your family's 
            educational journey.
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '40px'
          }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#3b82f6',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                fontSize: '24px'
              }}>
                📋
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#0f172a',
                margin: '0 0 12px 0'
              }}>
                Create Study Plans
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#64748b',
                lineHeight: '1.6',
                margin: '0'
              }}>
                Design comprehensive study plans with subjects, topics, and learning objectives 
                tailored to each child's needs.
              </p>
            </div>
            
            <div style={{ textAlign: 'left' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#10b981',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                fontSize: '24px'
              }}>
                📊
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#0f172a',
                margin: '0 0 12px 0'
              }}>
                Track Progress
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#64748b',
                lineHeight: '1.6',
                margin: '0'
              }}>
                Monitor learning progress with detailed analytics, completion tracking, and 
                performance insights.
              </p>
            </div>
            
            <div style={{ textAlign: 'left' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#8b5cf6',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                fontSize: '24px'
              }}>
                👨‍👩‍👧‍👦
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#0f172a',
                margin: '0 0 12px 0'
              }}>
                Family Collaboration
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#64748b',
                lineHeight: '1.6',
                margin: '0'
              }}>
                Connect parents and children in a shared learning environment with role-based 
                access and communication.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{
        padding: '80px 24px',
        background: '#f8fafc'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: '800',
            color: '#0f172a',
            margin: '0 0 16px 0'
          }}>
            Simple, transparent pricing
          </h2>
          
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            margin: '0 0 64px 0'
          }}>
            Choose the plan that's right for your family
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '32px',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {/* Free Plan */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '32px 24px',
              border: '1px solid #e2e8f0',
              textAlign: 'left'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#0f172a',
                margin: '0 0 8px 0'
              }}>
                Free
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                margin: '0 0 24px 0'
              }}>
                Perfect for getting started
              </p>
              
              <div style={{ marginBottom: '24px' }}>
                <span style={{
                  fontSize: '36px',
                  fontWeight: '800',
                  color: '#0f172a'
                }}>
                  $0
                </span>
                <span style={{
                  fontSize: '14px',
                  color: '#64748b'
                }}>
                  /month
                </span>
              </div>
              
              <Link to="/register" style={{
                display: 'block',
                background: '#1e293b',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                Start Free
              </Link>
              
              <div>
                <p style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 16px 0'
                }}>
                  What's included
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: '0',
                  margin: '0'
                }}>
                  <li style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#475569'
                  }}>
                    <span style={{ color: '#10b981' }}>✓</span>
                    1 family
                  </li>
                  <li style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#475569'
                  }}>
                    <span style={{ color: '#10b981' }}>✓</span>
                    Up to 3 children
                  </li>
                  <li style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#475569'
                  }}>
                    <span style={{ color: '#10b981' }}>✓</span>
                    Basic study plans
                  </li>
                  <li style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: '#475569'
                  }}>
                    <span style={{ color: '#10b981' }}>✓</span>
                    Progress tracking
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Pro Plan */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '32px 24px',
              border: '2px solid #3b82f6',
              textAlign: 'left',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#3b82f6',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                Most Popular
              </div>
              
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#0f172a',
                margin: '0 0 8px 0'
              }}>
                Pro
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                margin: '0 0 24px 0'
              }}>
                Best for growing families
              </p>
              
              <div style={{ marginBottom: '24px' }}>
                <span style={{
                  fontSize: '36px',
                  fontWeight: '800',
                  color: '#0f172a'
                }}>
                  $19
                </span>
                <span style={{
                  fontSize: '14px',
                  color: '#64748b'
                }}>
                  /month
                </span>
              </div>
              
              <Link to="/register" style={{
                display: 'block',
                background: '#3b82f6',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                Start Pro Trial
              </Link>
              
              <div>
                <p style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 16px 0'
                }}>
                  Everything in free, plus
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: '0',
                  margin: '0'
                }}>
                  <li style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#475569'
                  }}>
                    <span style={{ color: '#10b981' }}>✓</span>
                    Unlimited children
                  </li>
                  <li style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#475569'
                  }}>
                    <span style={{ color: '#10b981' }}>✓</span>
                    Advanced analytics
                  </li>
                  <li style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#475569'
                  }}>
                    <span style={{ color: '#10b981' }}>✓</span>
                    AI recommendations
                  </li>
                  <li style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: '#475569'
                  }}>
                    <span style={{ color: '#10b981' }}>✓</span>
                    Priority support
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Enterprise Plan */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '32px 24px',
              border: '1px solid #e2e8f0',
              textAlign: 'left'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#0f172a',
                margin: '0 0 8px 0'
              }}>
                Enterprise
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                margin: '0 0 24px 0'
              }}>
                For schools and organizations
              </p>
              
              <div style={{ marginBottom: '24px' }}>
                <span style={{
                  fontSize: '36px',
                  fontWeight: '800',
                  color: '#0f172a'
                }}>
                  $99
                </span>
                <span style={{
                  fontSize: '14px',
                  color: '#64748b'
                }}>
                  /month
                </span>
              </div>
              
              <button style={{
                display: 'block',
                width: '100%',
                background: '#1e293b',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '24px'
              }}>
                Contact Sales
              </button>
              
              <div>
                <p style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 16px 0'
                }}>
                  Everything in pro, plus
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: '0',
                  margin: '0'
                }}>
                  <li style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#475569'
                  }}>
                    <span style={{ color: '#10b981' }}>✓</span>
                    Multiple families
                  </li>
                  <li style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#475569'
                  }}>
                    <span style={{ color: '#10b981' }}>✓</span>
                    Admin dashboard
                  </li>
                  <li style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#475569'
                  }}>
                    <span style={{ color: '#10b981' }}>✓</span>
                    Custom integrations
                  </li>
                  <li style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: '#475569'
                  }}>
                    <span style={{ color: '#10b981' }}>✓</span>
                    Dedicated support
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#1e293b',
        color: 'white',
        padding: '40px 24px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <p style={{
            fontSize: '14px',
            opacity: 0.8,
            margin: '0'
          }}>
            © {new Date().getFullYear()} Study Plan Pro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;