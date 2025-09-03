import React, { useState, useEffect } from 'react';
import { planAdaptationService, ContentRecommendations } from '../../services/planAdaptationService';
import { analyticsService } from '../../services/analyticsService';

interface AdaptationRecommendationsProps {
  childId: string;
  planId: string;
  onAdapt: () => void;
}

const AdaptationRecommendations: React.FC<AdaptationRecommendationsProps> = ({ 
  childId, 
  planId,
  onAdapt
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<ContentRecommendations | null>(null);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [adaptationSuggestion, setAdaptationSuggestion] = useState<{
    suggest: boolean;
    reason: string;
    type?: string;
  } | null>(null);
  const [adapting, setAdapting] = useState<boolean>(false);
  const [adaptationResult, setAdaptationResult] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get content recommendations
        const recommendationsData = await planAdaptationService.getContentRecommendations(childId);
        setRecommendations(recommendationsData);
        
        // Get analytics data to determine if adaptation is needed
        const timeFrame = analyticsService.getDefaultTimeFrame();
        const progressReport = await analyticsService.getProgressReport(childId, timeFrame);
        
        // This is simplified - in a real app, you'd have more detailed metrics
        const simplifiedMetrics = {
          completedActivities: progressReport.activitiesCompleted,
          totalActivities: progressReport.activitiesCompleted + 
                          progressReport.activitiesInProgress + 
                          progressReport.activitiesNotStarted,
          averageScore: progressReport.averageScore,
          completionRate: progressReport.completionRate,
          // These would come from more detailed analytics in a real app
          lowScoreActivities: progressReport.averageScore < 60 ? 2 : 0,
          highScoreActivities: progressReport.averageScore > 85 ? 3 : 0
        };
        
        setMetrics(simplifiedMetrics);
        
        // Check if adaptation should be suggested
        const suggestion = planAdaptationService.shouldSuggestAdaptation(simplifiedMetrics);
        setAdaptationSuggestion(suggestion);
      } catch (err) {
        setError('Failed to load recommendations. Please try again later.');
        console.error('Error fetching adaptation data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [childId, planId]);

  const handleAdaptPlan = async () => {
    try {
      setAdapting(true);
      const result = await planAdaptationService.adaptPlan(childId, planId);
      setAdaptationResult(result);
      onAdapt(); // Notify parent component that adaptation was performed
    } catch (err) {
      setError('Failed to adapt plan. Please try again later.');
      console.error('Error adapting plan:', err);
    } finally {
      setAdapting(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading recommendations...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4">Learning Recommendations</h2>
      
      {adaptationSuggestion && adaptationSuggestion.suggest && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-lg font-medium text-blue-800">Plan Adaptation Suggested</h3>
          <p className="text-blue-700 mb-3">{adaptationSuggestion.reason}</p>
          
          {adaptationSuggestion.type === 'decrease_difficulty' && (
            <p className="mb-3">The current content appears to be too challenging. We recommend decreasing the difficulty level.</p>
          )}
          
          {adaptationSuggestion.type === 'increase_difficulty' && (
            <p className="mb-3">Your child is excelling! We recommend increasing the difficulty to keep them challenged.</p>
          )}
          
          {adaptationSuggestion.type === 'increase_engagement' && (
            <p className="mb-3">Your child's engagement could be improved. We recommend adjusting the content to be more engaging.</p>
          )}
          
          <button
            onClick={handleAdaptPlan}
            disabled={adapting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {adapting ? 'Adapting Plan...' : 'Adapt Plan Automatically'}
          </button>
        </div>
      )}
      
      {adaptationResult && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-medium text-green-800">Plan Successfully Adapted!</h3>
          <p className="text-green-700">
            {adaptationResult.adaptationType === 'decrease_difficulty' && 'The plan difficulty has been decreased to better match your child\'s needs.'}
            {adaptationResult.adaptationType === 'increase_difficulty' && 'The plan difficulty has been increased to provide more challenge.'}
            {adaptationResult.adaptationType === 'increase_engagement' && 'The plan has been modified to improve engagement.'}
          </p>
        </div>
      )}
      
      {recommendations && (
        <div className="space-y-6">
          {recommendations.focusAreaRecommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Focus Area Recommendations</h3>
              <div className="space-y-3">
                {recommendations.focusAreaRecommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <h4 className="font-medium">{rec.title}</h4>
                    <p className="text-sm text-gray-600">{rec.subject} • {rec.activityType}</p>
                    <p className="mt-1">{rec.description}</p>
                    <p className="mt-1 text-sm text-gray-700"><span className="font-medium">Why:</span> {rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {recommendations.strengthBuildingRecommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Strength Building Recommendations</h3>
              <div className="space-y-3">
                {recommendations.strengthBuildingRecommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-green-50 border border-green-200 rounded">
                    <h4 className="font-medium">{rec.title}</h4>
                    <p className="text-sm text-gray-600">{rec.subject} • {rec.activityType}</p>
                    <p className="mt-1">{rec.description}</p>
                    <p className="mt-1 text-sm text-gray-700"><span className="font-medium">Why:</span> {rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {recommendations.learningStyleRecommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Learning Style Recommendations</h3>
              <div className="space-y-3">
                {recommendations.learningStyleRecommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="font-medium">{rec.title}</h4>
                    <p className="text-sm text-gray-600">{rec.activityType}</p>
                    <p className="mt-1">{rec.description}</p>
                    <p className="mt-1 text-sm text-gray-700"><span className="font-medium">Why:</span> {rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdaptationRecommendations;