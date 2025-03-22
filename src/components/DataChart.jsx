import React from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  Area,
  ReferenceLine,
  Cell
} from 'recharts';
import { Trash2 } from 'lucide-react';

const DataChart = ({ 
  data,
  selectedXColumn,
  selectedYColumn,
  graphType,
  chartConfig,
  statisticalAnalysis,
  timeSeriesAnalysis,
  showFuturePrediction,
  predictFutureValues,
  deleteComparisonChart
}) => {
  const { x, y, type, id } = chartConfig || { 
    x: selectedXColumn, 
    y: selectedYColumn, 
    type: graphType, 
    id: null 
  };
  
  if (!data || !x || !y) return null;

  // Combine actual data with predictions if enabled
  let chartData = [...data];
  if (showFuturePrediction && type !== 'pie') {
    const predictions = predictFutureValues();
    if (predictions) {
      chartData = [...chartData, ...predictions];
    }
  }

  // For time series data, use the time series chart if available
  const isTimeSeries = timeSeriesAnalysis && timeSeriesAnalysis.trend && timeSeriesAnalysis.trend.length > 0;
  
  // Use time series data for line charts if available
  if (isTimeSeries && type === 'line') {
    return (
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={showFuturePrediction ? timeSeriesAnalysis.combinedDataWithForecast : timeSeriesAnalysis.trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [value.toFixed(2), name === 'value' ? selectedYColumn : 'Moving Avg']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            {statisticalAnalysis && (
              <ReferenceLine 
                y={statisticalAnalysis.mean.y} 
                stroke="red" 
                strokeDasharray="3 3"
                label={{ value: 'Mean', position: 'insideBottomRight' }}
              />
            )}
            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.2} name={selectedYColumn} />
            <Line type="monotone" dataKey="movingAverage" stroke="#ff7300" dot={false} name="Moving Avg" />
            {showFuturePrediction && timeSeriesAnalysis.forecast && (
              <Line 
                type="monotone" 
                dataKey="forecastValue" 
                stroke="#82ca9d" 
                strokeDasharray="5 5" 
                name="Forecast"
                connectNulls={true}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const chartProps = {
    data: chartData,
    margin: { top: 20, right: 30, left: 20, bottom: 5 }
  };

  const chartComponents = {
    line: (
      <LineChart {...chartProps}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey={x} 
          tickFormatter={val => typeof val === 'number' ? val.toFixed(1) : val} 
        />
        <YAxis />
        <Tooltip />
        <Legend />
        {statisticalAnalysis && (
          <ReferenceLine 
            y={statisticalAnalysis.mean.y} 
            stroke="red" 
            strokeDasharray="3 3"
            label={{ value: 'Mean', position: 'insideBottomRight' }}
          />
        )}
        <Line 
          type="monotone" 
          dataKey={y} 
          stroke="#8884d8" 
          dot={(props) => {
            // Highlight predictions with different dots
            const isPrediction = props.payload.isPrediction;
            if (isPrediction) {
              return (
                <svg 
                  x={props.cx - 6} 
                  y={props.cy - 6} 
                  width={12} 
                  height={12} 
                  fill="#82ca9d"
                >
                  <polygon points="6,0 12,12 0,12" />
                </svg>
              );
            }
            return <circle cx={props.cx} cy={props.cy} r={4} fill="#8884d8" />;
          }}
          
          // Add a dotted line for predicted values
          strokeDasharray={(dot) => {
            return dot && dot.payload && dot.payload.isPrediction ? "5 5" : "0";
          }}
        />
        {/* Add linear regression line if available */}
        {statisticalAnalysis?.linearRegression && (
          <Line 
            type="linear"
            dataKey={x}
            stroke="#ff7300"
            dot={false}
            activeDot={false}
            label={false}
            legendType="none"
            // Calculate Y values based on regression formula
            data={[
              { [x]: Math.min(...chartData.map(item => parseFloat(item[x])).filter(val => !isNaN(val))), 
                [y]: statisticalAnalysis.linearRegression.m * Math.min(...chartData.map(item => parseFloat(item[x])).filter(val => !isNaN(val))) + statisticalAnalysis.linearRegression.b },
              { [x]: Math.max(...chartData.map(item => parseFloat(item[x])).filter(val => !isNaN(val))), 
                [y]: statisticalAnalysis.linearRegression.m * Math.max(...chartData.map(item => parseFloat(item[x])).filter(val => !isNaN(val))) + statisticalAnalysis.linearRegression.b }
            ]}
          />
        )}
      </LineChart>
    ),
    bar: (
      <BarChart {...chartProps}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={x} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar 
          dataKey={y} 
          fill={(entry) => entry.isPrediction ? "#82ca9d" : "#8884d8"} 
        />
        {statisticalAnalysis && (
          <ReferenceLine 
            y={statisticalAnalysis.mean.y} 
            stroke="red" 
            strokeDasharray="3 3"
            label={{ value: 'Mean', position: 'insideBottomRight' }}
          />
        )}
      </BarChart>
    ),
    pie: (
      <PieChart {...chartProps}>
        <Pie
          data={chartData}
          dataKey={y}
          nameKey={x}
          cx="50%"
          cy="50%"
          outerRadius={120}
          fill="#8884d8"
          label={(entry) => entry[x]}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={`hsl(${index * 360 / chartData.length}, 70%, 60%)`} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => value.toFixed(2)} />
        <Legend />
      </PieChart>
    ),
    scatter: (
      <ScatterChart {...chartProps}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey={x} 
          type="number"
          name={x}
          tickFormatter={val => typeof val === 'number' ? val.toFixed(1) : val}
        />
        <YAxis 
          dataKey={y} 
          type="number" 
          name={y}
        />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />
        <Scatter 
          name={`${x} vs ${y}`} 
          data={chartData} 
          fill={(entry) => entry.isPrediction ? "#82ca9d" : "#8884d8"}
          shape={(props) => {
            // Custom shape for predictions
            if (props.payload.isPrediction) {
              return (
                <svg 
                  x={props.cx - 6} 
                  y={props.cy - 6} 
                  width={12} 
                  height={12} 
                  fill="#82ca9d"
                >
                  <polygon points="6,0 12,12 0,12" />
                </svg>
              );
            }
            return <circle cx={props.cx} cy={props.cy} r={4} fill="#8884d8" />;
          }} 
        />
        {/* Add linear regression line if available */}
        {statisticalAnalysis?.linearRegression && (
          <Line 
            type="linear"
            dataKey={x}
            stroke="#ff7300"
            dot={false}
            // Calculate Y values based on regression formula
            data={[
              { [x]: Math.min(...chartData.map(item => parseFloat(item[x])).filter(val => !isNaN(val))), 
                [y]: statisticalAnalysis.linearRegression.m * Math.min(...chartData.map(item => parseFloat(item[x])).filter(val => !isNaN(val))) + statisticalAnalysis.linearRegression.b },
              { [x]: Math.max(...chartData.map(item => parseFloat(item[x])).filter(val => !isNaN(val))), 
                [y]: statisticalAnalysis.linearRegression.m * Math.max(...chartData.map(item => parseFloat(item[x])).filter(val => !isNaN(val))) + statisticalAnalysis.linearRegression.b }
            ]}
          />
        )}
      </ScatterChart>
    )
  };

  return (
    <div className="relative w-full h-[400px]">
      <ResponsiveContainer width="100%" height={400}>
        {chartComponents[type] || null}
      </ResponsiveContainer>
      {id && (
        <button 
          onClick={() => deleteComparisonChart(id)}
          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
          title="Remove Chart"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
};

export default DataChart; 