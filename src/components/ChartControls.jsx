import React from 'react';

const ChartControls = ({ 
  columns, 
  selectedXColumn, 
  setSelectedXColumn, 
  selectedYColumn, 
  setSelectedYColumn, 
  graphType, 
  setGraphType, 
  addComparisonChart, 
  showFuturePrediction, 
  setShowFuturePrediction 
}) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      <select 
        className="w-40 px-3 py-2 border border-gray-300 rounded-md"
        value={selectedXColumn || ''}
        onChange={(e) => setSelectedXColumn(e.target.value)}
      >
        <option value="">X-Axis Column</option>
        {columns.map(col => (
          <option key={col} value={col}>{col}</option>
        ))}
      </select>

      <select 
        className="w-40 px-3 py-2 border border-gray-300 rounded-md"
        value={selectedYColumn || ''}
        onChange={(e) => setSelectedYColumn(e.target.value)}
      >
        <option value="">Y-Axis Column</option>
        {columns.map(col => (
          <option key={col} value={col}>{col}</option>
        ))}
      </select>

      <select 
        className="w-40 px-3 py-2 border border-gray-300 rounded-md"
        value={graphType}
        onChange={(e) => setGraphType(e.target.value)}
      >
        <option value="line">Line Chart</option>
        <option value="bar">Bar Chart</option>
        <option value="pie">Pie Chart</option>
        <option value="scatter">Scatter Plot</option>
      </select>

      <button 
        onClick={addComparisonChart}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        disabled={!selectedXColumn || !selectedYColumn}
      >
        Add Comparison Chart
      </button>
      
      <button 
        onClick={() => setShowFuturePrediction(!showFuturePrediction)}
        className={`px-4 py-2 rounded-md transition-colors ${
          showFuturePrediction 
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
      >
        {showFuturePrediction ? 'Hide Predictions' : 'Show Forecast'}
      </button>
    </div>
  );
};

export default ChartControls; 