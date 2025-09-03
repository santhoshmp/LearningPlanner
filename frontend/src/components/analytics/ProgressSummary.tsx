import React from 'react';
import { ProgressReport } from '../../types/analytics';
import { useTheme } from '../../theme/ThemeContext';
import { 
  combineClasses, 
  getCardClasses, 
  getProgressColor, 
  getGradeColor,
  getStatusClasses,
  getResponsivePadding,
  getBorderRadius
} from '../../utils/themeHelpers';

interface ProgressSummaryProps {
  report: ProgressReport;
}

const ProgressSummary: React.FC<ProgressSummaryProps> = ({ report }) => {
  const { userRole } = useTheme();
  
  const formatTimeSpent = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} minutes`;
    } else if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
    }
  };

  const totalActivities = 
    report.activitiesCompleted + 
    report.activitiesInProgress + 
    report.activitiesNotStarted;

  return (
    <div className={combineClasses("space-y-6", "animate-fade-in")}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={combineClasses(
          getCardClasses(userRole),
          "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
          getResponsivePadding('md'),
          getBorderRadius(userRole, 'md'),
          "animate-slide-up"
        )}>
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Completion Rate</h3>
          <div className="flex items-end">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(report.completionRate)}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">of activities</span>
          </div>
          <div className={combineClasses(
            "mt-2 h-2 w-full bg-gray-200 dark:bg-gray-700 overflow-hidden",
            getBorderRadius(userRole, 'sm')
          )}>
            <div 
              className={combineClasses(
                "h-full transition-all duration-500 ease-out",
                getProgressColor(report.completionRate)
              )}
              style={{ width: `${report.completionRate}%` }}
            ></div>
          </div>
        </div>
        
        <div className={combineClasses(
          getCardClasses(userRole),
          "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
          getResponsivePadding('md'),
          getBorderRadius(userRole, 'md'),
          "animate-slide-up"
        )} style={{ animationDelay: '100ms' }}>
          <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Average Score</h3>
          <div className="flex items-end">
            <span className={combineClasses(
              "text-2xl font-bold",
              getGradeColor(report.averageScore)
            )}>
              {Math.round(report.averageScore)}%
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {report.activitiesCompleted} completed activities
          </div>
        </div>
        
        <div className={combineClasses(
          getCardClasses(userRole),
          "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20",
          getResponsivePadding('md'),
          getBorderRadius(userRole, 'md'),
          "animate-slide-up"
        )} style={{ animationDelay: '200ms' }}>
          <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">Time Spent</h3>
          <div className="flex items-end">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatTimeSpent(report.totalTimeSpent)}
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {report.lastActivityDate ? `Last activity: ${new Date(report.lastActivityDate).toLocaleDateString()}` : 'No activity yet'}
          </div>
        </div>
      </div>
      
      <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Status</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          {totalActivities > 0 ? (
            <>
              <div className={combineClasses(
                getCardClasses(userRole),
                "flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                getResponsivePadding('sm'),
                getBorderRadius(userRole, 'sm'),
                "transition-all duration-200 hover:shadow-md"
              )}>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Completed</span>
                  <span className={combineClasses(
                    "text-sm font-medium",
                    getStatusClasses('completed')
                  )}>{report.activitiesCompleted}</span>
                </div>
                <div className={combineClasses(
                  "mt-1 h-1.5 w-full bg-gray-100 dark:bg-gray-700 overflow-hidden",
                  getBorderRadius(userRole, 'sm')
                )}>
                  <div 
                    className="h-full bg-status-completed transition-all duration-500 ease-out" 
                    style={{ width: `${(report.activitiesCompleted / totalActivities) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className={combineClasses(
                getCardClasses(userRole),
                "flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                getResponsivePadding('sm'),
                getBorderRadius(userRole, 'sm'),
                "transition-all duration-200 hover:shadow-md"
              )}>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">In Progress</span>
                  <span className={combineClasses(
                    "text-sm font-medium",
                    getStatusClasses('in-progress')
                  )}>{report.activitiesInProgress}</span>
                </div>
                <div className={combineClasses(
                  "mt-1 h-1.5 w-full bg-gray-100 dark:bg-gray-700 overflow-hidden",
                  getBorderRadius(userRole, 'sm')
                )}>
                  <div 
                    className="h-full bg-status-in-progress transition-all duration-500 ease-out" 
                    style={{ width: `${(report.activitiesInProgress / totalActivities) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className={combineClasses(
                getCardClasses(userRole),
                "flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                getResponsivePadding('sm'),
                getBorderRadius(userRole, 'sm'),
                "transition-all duration-200 hover:shadow-md"
              )}>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Not Started</span>
                  <span className={combineClasses(
                    "text-sm font-medium",
                    getStatusClasses('not-started')
                  )}>{report.activitiesNotStarted}</span>
                </div>
                <div className={combineClasses(
                  "mt-1 h-1.5 w-full bg-gray-100 dark:bg-gray-700 overflow-hidden",
                  getBorderRadius(userRole, 'sm')
                )}>
                  <div 
                    className="h-full bg-status-not-started transition-all duration-500 ease-out" 
                    style={{ width: `${(report.activitiesNotStarted / totalActivities) * 100}%` }}
                  ></div>
                </div>
              </div>
            </>
          ) : (
            <div className={combineClasses(
              "w-full text-center py-4 text-gray-500 dark:text-gray-400",
              getCardClasses(userRole),
              "bg-gray-50 dark:bg-gray-800",
              getBorderRadius(userRole, 'md')
            )}>
              No activities available
            </div>
          )}
        </div>
      </div>
      
      <div className={combineClasses(
        "flex items-center justify-between",
        "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
        getCardClasses(userRole),
        getResponsivePadding('md'),
        getBorderRadius(userRole, 'md'),
        "animate-slide-up"
      )} style={{ animationDelay: '400ms' }}>
        <div>
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Help Requests</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {report.helpRequestsCount > 0 
              ? `${report.helpRequestsCount} help requests during this period` 
              : 'No help requests during this period'}
          </p>
        </div>
        {report.helpRequestsCount > 0 && (
          <span className={combineClasses(
            "text-xl font-bold text-blue-700 dark:text-blue-300",
            "animate-scale-in"
          )}>{report.helpRequestsCount}</span>
        )}
      </div>
    </div>
  );
};

export default ProgressSummary;