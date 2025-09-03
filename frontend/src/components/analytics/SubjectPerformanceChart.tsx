import React from 'react';
import { SubjectPerformance } from '../../types/analytics';

interface SubjectPerformanceChartProps {
  subjects: SubjectPerformance[];
}

const SubjectPerformanceChart: React.FC<SubjectPerformanceChartProps> = ({ subjects }) => {
  // Sort subjects by completion rate for better visualization
  const sortedSubjects = [...subjects].sort((a, b) => b.completionRate - a.completionRate);

  const getBarColor = (score: number): string => {
    if (score >= 90) return 'bg-green-600';
    if (score >= 75) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatTimeSpent = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  };

  return (
    <div className="space-y-4">
      {sortedSubjects.length > 0 ? (
        sortedSubjects.map((subject) => (
          <div key={subject.subject} className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="font-medium">{subject.subject}</span>
                <span className="text-xs text-gray-500 ml-2">
                  {formatTimeSpent(subject.timeSpent)}
                </span>
              </div>
              <span className="text-sm font-medium">
                {Math.round(subject.averageScore)}%
              </span>
            </div>
            
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getBarColor(subject.averageScore)}`} 
                style={{ width: `${subject.completionRate}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>Completion: {Math.round(subject.completionRate)}%</span>
              <span>Score: {Math.round(subject.averageScore)}%</span>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          No subject performance data available
        </div>
      )}
    </div>
  );
};

export default SubjectPerformanceChart;