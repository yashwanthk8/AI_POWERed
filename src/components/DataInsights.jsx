import React from 'react';
import { TrendingUp, AlertTriangle, Info, BarChart2 } from 'lucide-react';

const DataInsights = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  // Severity to color mapping for insights
  const severityColor = {
    high: 'bg-blue-100 border-blue-500 text-blue-700',
    medium: 'bg-green-100 border-green-500 text-green-700',
    low: 'bg-yellow-100 border-yellow-500 text-yellow-700'
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Info size={20} /> Automated Insights
      </h3>
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className={`${severityColor[insight.severity]} p-4 rounded-lg border-l-4 flex items-start gap-3`}
          >
            <div className="flex-shrink-0 pt-1">
              {insight.icon}
            </div>
            <div>
              <h4 className="font-semibold mb-1">{insight.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{insight.message}</p>
              <p className="text-xs text-gray-500 font-medium">{insight.recommendation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataInsights; 