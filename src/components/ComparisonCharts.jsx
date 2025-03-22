import React from 'react';
import DataChart from './DataChart';

const ComparisonCharts = ({ 
  additionalCharts, 
  data, 
  statisticalAnalysis, 
  timeSeriesAnalysis, 
  showFuturePrediction, 
  predictFutureValues, 
  deleteComparisonChart 
}) => {
  if (!additionalCharts || additionalCharts.length === 0) return null;
  
  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-6">Comparison Views</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {additionalCharts.map(chartConfig => (
          <div 
            key={chartConfig.id}
            className="bg-white p-4 rounded-xl shadow-lg relative"
          >
            <DataChart 
              data={data}
              statisticalAnalysis={statisticalAnalysis}
              timeSeriesAnalysis={timeSeriesAnalysis}
              showFuturePrediction={showFuturePrediction}
              predictFutureValues={predictFutureValues}
              deleteComparisonChart={deleteComparisonChart}
              chartConfig={chartConfig}
            />
            <div className="mt-2 text-center text-sm text-gray-500">
              {chartConfig.x} vs {chartConfig.y}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComparisonCharts; 