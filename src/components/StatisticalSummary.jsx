import React from 'react';

const StatisticalSummary = ({ statisticalAnalysis }) => {
  if (!statisticalAnalysis) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Correlation</h3>
        <p className="text-2xl font-bold">
          {statisticalAnalysis.correlation.toFixed(2)}
        </p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Data Points</h3>
        <p className="text-2xl font-bold">
          {statisticalAnalysis.dataPoints}
        </p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Y Range</h3>
        <p className="text-sm">
          {statisticalAnalysis.range.y[0].toFixed(2)} - {statisticalAnalysis.range.y[1].toFixed(2)}
        </p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Outliers</h3>
        <p className="text-2xl font-bold">
          {statisticalAnalysis.outliers.length}
        </p>
      </div>
    </div>
  );
};

export default StatisticalSummary; 