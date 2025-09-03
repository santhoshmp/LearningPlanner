import React, { useEffect, useRef } from 'react';
import { PerformanceTrend } from '../../types/analytics';

interface PerformanceTrendChartProps {
  trends: PerformanceTrend[];
}

const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = ({ trends }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!chartRef.current || trends.length === 0) return;

    // This is a placeholder for chart rendering
    // In a real implementation, you would use a charting library like Chart.js
    // For now, we'll create a simple visualization
    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set dimensions
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw axes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.strokeStyle = '#ccc';
    ctx.stroke();

    // Draw completion rate line
    if (trends.length > 0) {
      const maxValue = 100; // Percentage values
      const xStep = chartWidth / (trends.length - 1);

      // Completion rate line (blue)
      ctx.beginPath();
      trends.forEach((trend, i) => {
        const x = padding + i * xStep;
        const y = height - padding - (trend.completionRate / maxValue) * chartHeight;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.strokeStyle = '#3b82f6'; // blue
      ctx.lineWidth = 2;
      ctx.stroke();

      // Average score line (green)
      ctx.beginPath();
      trends.forEach((trend, i) => {
        const x = padding + i * xStep;
        const y = height - padding - (trend.averageScore / maxValue) * chartHeight;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.strokeStyle = '#10b981'; // green
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw x-axis labels
      ctx.fillStyle = '#666';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      trends.forEach((trend, i) => {
        const x = padding + i * xStep;
        ctx.fillText(trend.period, x, height - padding + 15);
      });

      // Draw y-axis labels
      ctx.textAlign = 'right';
      for (let i = 0; i <= 5; i++) {
        const value = i * 20;
        const y = height - padding - (value / maxValue) * chartHeight;
        ctx.fillText(`${value}%`, padding - 5, y + 3);
      }

      // Draw legend
      const legendY = padding - 15;
      
      // Completion rate legend
      ctx.beginPath();
      ctx.moveTo(padding + 10, legendY);
      ctx.lineTo(padding + 30, legendY);
      ctx.strokeStyle = '#3b82f6';
      ctx.stroke();
      ctx.fillStyle = '#333';
      ctx.textAlign = 'left';
      ctx.fillText('Completion Rate', padding + 35, legendY + 3);
      
      // Average score legend
      ctx.beginPath();
      ctx.moveTo(padding + 150, legendY);
      ctx.lineTo(padding + 170, legendY);
      ctx.strokeStyle = '#10b981';
      ctx.stroke();
      ctx.fillText('Average Score', padding + 175, legendY + 3);
    }
  }, [trends]);

  return (
    <div className="w-full h-64">
      {trends.length > 0 ? (
        <>
          <canvas 
            ref={chartRef} 
            width={600} 
            height={300} 
            className="w-full h-full"
          ></canvas>
          <div className="text-xs text-gray-500 text-center mt-2">
            Note: This is a simplified chart visualization. In production, use a proper charting library.
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          No trend data available for the selected period
        </div>
      )}
    </div>
  );
};

export default PerformanceTrendChart;