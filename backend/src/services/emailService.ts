import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@aistudyplanner.com';
    
    // For development, use a mock transporter that just logs
    if (process.env.NODE_ENV !== 'production') {
      this.transporter = {
        sendMail: async (mailOptions: any) => {
          console.log('DEVELOPMENT MODE - Email would be sent:');
          console.log('To:', mailOptions.to);
          console.log('Subject:', mailOptions.subject);
          
          // Return a fake success response
          return {
            messageId: 'dev-mode-' + Date.now(),
            response: 'Development mode - no email sent'
          };
        }
      } as any;
    } else {
      // Production configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'apikey',
          pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY || ''
        }
      });
    }
  }

  async sendVerificationEmail(email: string, token: string, firstName: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: this.fromEmail,
      to: email,
      subject: 'Verify Your AI Study Planner Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to AI Study Planner!</h2>
          <p>Hi ${firstName},</p>
          <p>Thank you for signing up for AI Study Planner. To complete your registration, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
          
          <p>This verification link will expire in 24 hours for security reasons.</p>
          
          <p>If you didn't create an account with AI Study Planner, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            The AI Study Planner Team
          </p>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent:', info.messageId);
    } catch (error) {
      console.error('Error sending verification email:', error);
      
      // For development, don't throw error to allow registration without email
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to send verification email');
      } else {
        console.log('In development mode - continuing without email verification');
      }
    }
  }

  async sendPasswordResetEmail(email: string, token: string, firstName: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: this.fromEmail,
      to: email,
      subject: 'Reset Your AI Study Planner Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Password Reset Request</h2>
          <p>Hi ${firstName},</p>
          <p>We received a request to reset your password for your AI Study Planner account. If you made this request, click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
          
          <p><strong>This reset link will expire in 1 hour for security reasons.</strong></p>
          
          <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            The AI Study Planner Team
          </p>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      
      // For development, don't throw error
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to send password reset email');
      } else {
        console.log('In development mode - continuing without password reset email');
      }
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const mailOptions = {
      from: this.fromEmail,
      to: email,
      subject: 'Welcome to AI Study Planner!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Welcome to AI Study Planner!</h2>
          <p>Hi ${firstName},</p>
          <p>Your email has been successfully verified! Welcome to AI Study Planner, where personalized learning meets AI innovation.</p>
          
          <h3>What's Next?</h3>
          <ul>
            <li>Add your child's profile to get started</li>
            <li>Create your first AI-powered study plan</li>
            <li>Explore the gamified learning experience</li>
            <li>Track progress with detailed analytics</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Get Started
            </a>
          </div>
          
          <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Happy learning!<br>
            The AI Study Planner Team
          </p>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error for welcome email as it's not critical
      console.log('Welcome email failed, but continuing...');
    }
  }

  async sendChildLoginNotification(
    parentEmail: string, 
    parentName: string, 
    childName: string, 
    deviceDescription: string, 
    loginTime: string
  ): Promise<void> {
    const mailOptions = {
      from: this.fromEmail,
      to: parentEmail,
      subject: `${childName} logged into AI Study Planner`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Child Login Notification</h2>
          <p>Hi ${parentName},</p>
          <p>This is a notification that <strong>${childName}</strong> has logged into their AI Study Planner account.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Login Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Child:</strong> ${childName}</li>
              <li><strong>Time:</strong> ${loginTime}</li>
              <li><strong>Device:</strong> ${deviceDescription}</li>
            </ul>
          </div>
          
          <p>If this login was expected, no action is needed. If you have concerns about this login, you can:</p>
          <ul>
            <li>Check your child's recent activity in the parent dashboard</li>
            <li>Review their session history</li>
            <li>Update their account security settings</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Dashboard
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            <strong>Note:</strong> You can manage notification preferences in your account settings.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            The AI Study Planner Team
          </p>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Child login notification sent:', info.messageId);
    } catch (error) {
      console.error('Error sending child login notification:', error);
      // Don't throw error for notification email as login should still succeed
      console.log('Child login notification failed, but continuing...');
    }
  }

  async sendChildAchievementNotification(
    parentEmail: string,
    parentName: string,
    childName: string,
    achievement: {
      title: string;
      description: string;
      type: string;
      earnedAt: Date;
    }
  ): Promise<void> {
    const achievementIcon = achievement.type === 'BADGE' ? '🏅' : 
                           achievement.type === 'MILESTONE' ? '🎯' : '🔥';
    
    const mailOptions = {
      from: this.fromEmail,
      to: parentEmail,
      subject: `🎉 ${childName} earned a new ${achievement.type.toLowerCase()}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">${achievementIcon} Achievement Unlocked!</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f8fafc; border-radius: 0 0 8px 8px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${parentName},</p>
            <p style="font-size: 16px;">Great news! <strong>${childName}</strong> has just earned a new achievement:</p>
            
            <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
              <h3 style="margin-top: 0; color: #059669; font-size: 20px;">${achievementIcon} ${achievement.title}</h3>
              <p style="color: #374151; margin-bottom: 10px;">${achievement.description}</p>
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                <strong>Earned:</strong> ${achievement.earnedAt.toLocaleDateString()} at ${achievement.earnedAt.toLocaleTimeString()}
              </p>
            </div>
            
            <p>This achievement shows that ${childName} is making excellent progress in their learning journey. Keep encouraging them to continue their great work!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/analytics" 
                 style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Full Progress Report
              </a>
            </div>
            
            <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin-top: 25px;">
              <h4 style="margin-top: 0; color: #0277bd;">💡 Parenting Tip</h4>
              <p style="margin-bottom: 0; color: #01579b;">
                Celebrate this achievement with ${childName}! Positive reinforcement helps maintain motivation and builds confidence in learning.
              </p>
            </div>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Keep up the great work!<br>
            The AI Study Planner Team
          </p>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Child achievement notification sent:', info.messageId);
    } catch (error) {
      console.error('Error sending child achievement notification:', error);
      console.log('Child achievement notification failed, but continuing...');
    }
  }

  async sendWeeklyProgressSummary(
    parentEmail: string,
    parentName: string,
    childName: string,
    weeklyStats: {
      activitiesCompleted: number;
      totalTimeSpent: number; // in minutes
      averageScore: number;
      streakDays: number;
      badgesEarned: number;
      subjectProgress: Array<{
        subject: string;
        activitiesCompleted: number;
        averageScore: number;
      }>;
    }
  ): Promise<void> {
    const hoursSpent = Math.round(weeklyStats.totalTimeSpent / 60 * 10) / 10;
    
    const mailOptions = {
      from: this.fromEmail,
      to: parentEmail,
      subject: `📊 ${childName}'s Weekly Learning Summary`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 25px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 24px;">📊 Weekly Progress Report</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Learning summary for ${childName}</p>
          </div>
          
          <div style="padding: 30px; background-color: #f8fafc;">
            <p style="font-size: 16px;">Hi ${parentName},</p>
            <p>Here's how ${childName} did this week:</p>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 25px 0;">
              <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #3b82f6;">
                <h3 style="margin: 0; color: #3b82f6; font-size: 24px;">${weeklyStats.activitiesCompleted}</h3>
                <p style="margin: 5px 0 0 0; color: #6b7280;">Activities Completed</p>
              </div>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #10b981;">
                <h3 style="margin: 0; color: #10b981; font-size: 24px;">${hoursSpent}h</h3>
                <p style="margin: 5px 0 0 0; color: #6b7280;">Study Time</p>
              </div>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #f59e0b;">
                <h3 style="margin: 0; color: #f59e0b; font-size: 24px;">${weeklyStats.averageScore}%</h3>
                <p style="margin: 5px 0 0 0; color: #6b7280;">Average Score</p>
              </div>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #ef4444;">
                <h3 style="margin: 0; color: #ef4444; font-size: 24px;">${weeklyStats.streakDays}</h3>
                <p style="margin: 5px 0 0 0; color: #6b7280;">Day Streak</p>
              </div>
            </div>
            
            ${weeklyStats.badgesEarned > 0 ? `
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <h4 style="margin-top: 0; color: #92400e;">🏅 Badges Earned This Week</h4>
                <p style="margin-bottom: 0; color: #92400e; font-size: 18px; font-weight: bold;">
                  ${weeklyStats.badgesEarned} new badge${weeklyStats.badgesEarned > 1 ? 's' : ''}!
                </p>
              </div>
            ` : ''}
            
            ${weeklyStats.subjectProgress.length > 0 ? `
              <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 25px 0;">
                <h4 style="margin-top: 0; color: #374151;">📚 Subject Breakdown</h4>
                ${weeklyStats.subjectProgress.map(subject => `
                  <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <strong style="color: #374151;">${subject.subject}</strong>
                      <span style="color: #6b7280;">${subject.averageScore}% avg</span>
                    </div>
                    <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
                      ${subject.activitiesCompleted} activities completed
                    </p>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/analytics" 
                 style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Detailed Analytics
              </a>
            </div>
            
            <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px;">
              <h4 style="margin-top: 0; color: #1e40af;">💡 This Week's Insight</h4>
              <p style="margin-bottom: 0; color: #1e3a8a;">
                ${weeklyStats.averageScore >= 80 
                  ? `${childName} is performing excellently! Consider introducing more challenging topics.`
                  : weeklyStats.averageScore >= 60
                  ? `${childName} is making steady progress. Keep encouraging consistent practice.`
                  : `${childName} might benefit from additional support or review of recent topics.`
                }
              </p>
            </div>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Keep supporting ${childName}'s learning journey!<br>
            The AI Study Planner Team
          </p>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Weekly progress summary sent:', info.messageId);
    } catch (error) {
      console.error('Error sending weekly progress summary:', error);
      console.log('Weekly progress summary failed, but continuing...');
    }
  }

  async sendSuspiciousActivityAlert(
    parentEmail: string,
    parentName: string,
    childName: string,
    alerts: Array<{
      alertType: string;
      severity: string;
      description: string;
      timestamp: Date;
    }>
  ): Promise<void> {
    const highSeverityAlerts = alerts.filter(a => a.severity === 'high');
    const isUrgent = highSeverityAlerts.length > 0;
    
    const mailOptions = {
      from: this.fromEmail,
      to: parentEmail,
      subject: `${isUrgent ? '🚨 URGENT: ' : '⚠️ '}Security Alert for ${childName}'s Account`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${isUrgent ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}; color: white; padding: 25px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 24px;">${isUrgent ? '🚨' : '⚠️'} Security Alert</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Unusual activity detected for ${childName}</p>
          </div>
          
          <div style="padding: 30px; background-color: #f8fafc;">
            <p style="font-size: 16px;">Hi ${parentName},</p>
            <p>We've detected some unusual activity on ${childName}'s account that requires your attention:</p>
            
            <div style="margin: 25px 0;">
              ${alerts.map(alert => `
                <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${
                  alert.severity === 'high' ? '#dc2626' : 
                  alert.severity === 'medium' ? '#f59e0b' : '#6b7280'
                };">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #374151;">${
                      alert.alertType === 'multiple_failed_logins' ? '🔒 Multiple Failed Logins' :
                      alert.alertType === 'unusual_login_time' ? '🕐 Unusual Login Time' :
                      alert.alertType === 'new_device' ? '📱 New Device Detected' :
                      alert.alertType === 'excessive_help_requests' ? '❓ Excessive Help Requests' :
                      alert.alertType === 'rapid_progress' ? '⚡ Rapid Progress' : 'Security Alert'
                    }</h4>
                    <span style="background-color: ${
                      alert.severity === 'high' ? '#fecaca' : 
                      alert.severity === 'medium' ? '#fed7aa' : '#e5e7eb'
                    }; color: ${
                      alert.severity === 'high' ? '#991b1b' : 
                      alert.severity === 'medium' ? '#9a3412' : '#374151'
                    }; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                      ${alert.severity.toUpperCase()}
                    </span>
                  </div>
                  <p style="margin: 0; color: #6b7280;">${alert.description}</p>
                  <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 14px;">
                    Detected: ${alert.timestamp.toLocaleDateString()} at ${alert.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              `).join('')}
            </div>
            
            <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h4 style="margin-top: 0; color: #1e40af;">🛡️ Recommended Actions</h4>
              <ul style="margin: 0; padding-left: 20px; color: #1e3a8a;">
                <li>Review ${childName}'s recent activity in the parent dashboard</li>
                <li>Check if these activities were authorized</li>
                <li>Consider updating ${childName}'s password if needed</li>
                <li>Review device access and remove unknown devices</li>
                <li>Talk to ${childName} about online safety</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                 style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-right: 10px;">
                Review Activity Now
              </a>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/security" 
                 style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Security Settings
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              <strong>Note:</strong> If you believe this is a false alarm, you can adjust security sensitivity in your account settings.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Your child's safety is our priority.<br>
            The AI Study Planner Security Team
          </p>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Suspicious activity alert sent:', info.messageId);
    } catch (error) {
      console.error('Error sending suspicious activity alert:', error);
      console.log('Suspicious activity alert failed, but continuing...');
    }
  }
}

export const emailService = new EmailService();