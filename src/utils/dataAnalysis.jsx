import * as ss from 'simple-statistics';
import React from 'react';
import { TrendingUp, AlertTriangle, Info, BarChart2 } from 'lucide-react';

// Statistical Analysis
export const performStatisticalAnalysis = (data, selectedXColumn, selectedYColumn) => {
  if (!data || !selectedXColumn || !selectedYColumn) return null;

  const numericData = data.map(item => [
    parseFloat(item[selectedXColumn]), 
    parseFloat(item[selectedYColumn])
  ]).filter(pair => !isNaN(pair[0]) && !isNaN(pair[1]));

  // Calculate quartiles for better distribution understanding
  const sortedYValues = [...numericData.map(d => d[1])].sort((a, b) => a - b);
  const q1 = ss.quantile(sortedYValues, 0.25);
  const q3 = ss.quantile(sortedYValues, 0.75);
  const iqr = q3 - q1;
  
  // Calculate potential outliers
  const outlierThresholdLow = q1 - 1.5 * iqr;
  const outlierThresholdHigh = q3 + 1.5 * iqr;
  const outliers = numericData.filter(d => 
    d[1] < outlierThresholdLow || d[1] > outlierThresholdHigh
  );

  // Linear regression for trend analysis
  const linearRegressionResult = numericData.length > 1 ? 
    ss.linearRegression(numericData) : null;
  
  // Calculate R-squared (coefficient of determination)
  let rSquared = null;
  if (linearRegressionResult) {
    const predictedY = numericData.map(point => 
      linearRegressionResult.m * point[0] + linearRegressionResult.b
    );
    
    const meanY = ss.mean(numericData.map(d => d[1]));
    const totalSumOfSquares = numericData.reduce((sum, point) => 
      sum + Math.pow(point[1] - meanY, 2), 0
    );
    
    const residualSumOfSquares = numericData.reduce((sum, point, i) => 
      sum + Math.pow(point[1] - predictedY[i], 2), 0
    );
    
    rSquared = 1 - (residualSumOfSquares / totalSumOfSquares);
  }
  
  return {
    mean: {
      x: ss.mean(numericData.map(d => d[0])),
      y: ss.mean(numericData.map(d => d[1]))
    },
    median: {
      x: ss.median(numericData.map(d => d[0])),
      y: ss.median(numericData.map(d => d[1]))
    },
    quartiles: {
      q1: q1,
      q3: q3,
      iqr: iqr
    },
    range: {
      x: [Math.min(...numericData.map(d => d[0])), Math.max(...numericData.map(d => d[0]))],
      y: [Math.min(...numericData.map(d => d[1])), Math.max(...numericData.map(d => d[1]))]
    },
    standardDeviation: {
      x: ss.standardDeviation(numericData.map(d => d[0])),
      y: ss.standardDeviation(numericData.map(d => d[1]))
    },
    correlation: ss.sampleCorrelation(
      numericData.map(d => d[0]), 
      numericData.map(d => d[1])
    ),
    outliers: outliers,
    linearRegression: linearRegressionResult,
    rSquared: rSquared,
    dataPoints: numericData.length
  };
};

// Time Series Analysis
export const performTimeSeriesAnalysis = (data, columns, selectedXColumn, selectedYColumn) => {
  if (!data || !selectedXColumn || !selectedYColumn) return null;

  const isDateColumn = (column) => {
    return data.some(item => !isNaN(Date.parse(item[column])));
  };

  // Try to find date column
  const dateColumn = columns.find(isDateColumn) || selectedXColumn;
  if (!dateColumn) return null;

  // Check if the selected X column can be parsed as dates
  const canParseAsDates = data.every(item => !isNaN(Date.parse(item[dateColumn])));
  
  if (!canParseAsDates) return null;

  const sortedData = [...data].sort((a, b) => 
    new Date(a[dateColumn]) - new Date(b[dateColumn])
  );

  // Calculate moving average
  const movingAverageWindow = Math.max(2, Math.floor(sortedData.length / 10));
  
  const trendData = sortedData.map((item, index) => {
    // For moving average, use a window of points
    const window = sortedData.slice(
      Math.max(0, index - movingAverageWindow), 
      index + 1
    );
    
    const movingAvg = ss.mean(
      window.map(d => parseFloat(d[selectedYColumn]))
        .filter(val => !isNaN(val))
    );
    
    return {
      date: item[dateColumn],
      value: parseFloat(item[selectedYColumn]),
      movingAverage: movingAvg
    };
  });

  // Detect seasonality (if enough data points)
  let seasonalityScore = null;
  if (sortedData.length > 12) {
    // Simple autocorrelation for seasonality detection
    const values = sortedData.map(item => parseFloat(item[selectedYColumn]))
      .filter(val => !isNaN(val));
    
    // Look for patterns with lag 2 to lag n/4
    const maxLag = Math.floor(values.length / 4);
    let bestCorrelation = 0;
    let bestLag = 0;
    
    for (let lag = 2; lag <= maxLag; lag++) {
      const series1 = values.slice(0, values.length - lag);
      const series2 = values.slice(lag);
      
      const correlation = Math.abs(ss.sampleCorrelation(series1, series2));
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestLag = lag;
      }
    }
    
    seasonalityScore = {
      score: bestCorrelation,
      period: bestLag
    };
  }

  // Simple forecast
  let forecast = null;
  if (sortedData.length > 5) {
    // Use last 5 points to predict next 3
    const lastFive = sortedData.slice(-5).map(item => parseFloat(item[selectedYColumn]));
    const avgChange = ss.mean(lastFive.slice(1).map((val, i) => val - lastFive[i]));
    
    const lastDate = new Date(sortedData[sortedData.length - 1][dateColumn]);
    const lastValue = parseFloat(sortedData[sortedData.length - 1][selectedYColumn]);
    
    forecast = [];
    for (let i = 1; i <= 3; i++) {
      const newDate = new Date(lastDate);
      // Attempt to determine the date increment pattern
      if (sortedData.length > 1) {
        const secondLastDate = new Date(sortedData[sortedData.length - 2][dateColumn]);
        const daysDiff = Math.round((lastDate - secondLastDate) / (1000 * 60 * 60 * 24));
        newDate.setDate(lastDate.getDate() + (daysDiff * i));
      } else {
        newDate.setDate(lastDate.getDate() + i);
      }
      
      forecast.push({
        date: newDate.toISOString().split('T')[0],
        forecastValue: lastValue + (avgChange * i),
        isForecast: true
      });
    }
  }

  return {
    trend: trendData,
    timeSpan: {
      start: sortedData[0][dateColumn],
      end: sortedData[sortedData.length - 1][dateColumn]
    },
    seasonality: seasonalityScore,
    forecast: forecast,
    combinedDataWithForecast: forecast ? [...trendData, ...forecast] : trendData
  };
};

// Predict future values for non-time series data
export const predictFutureValues = (data, selectedXColumn, selectedYColumn, statisticalAnalysis) => {
  if (!statisticalAnalysis?.linearRegression || !data || !selectedXColumn || !selectedYColumn) return null;
  
  const { linearRegression } = statisticalAnalysis;
  const { m, b } = linearRegression;
  
  // Get X values and find the max
  const xValues = data.map(item => parseFloat(item[selectedXColumn])).filter(x => !isNaN(x));
  const maxX = Math.max(...xValues);
  
  // Generate 5 future points
  const futurePredictions = [];
  const step = (maxX - Math.min(...xValues)) / 10; // Use 1/10th of the range as step
  
  for (let i = 1; i <= 5; i++) {
    const futureX = maxX + (step * i);
    const predictedY = m * futureX + b;
    
    futurePredictions.push({
      [selectedXColumn]: futureX,
      [selectedYColumn]: predictedY,
      isPrediction: true
    });
  }
  
  return futurePredictions;
};

// Generate Insights
export const generateInsights = (statisticalAnalysis, timeSeriesAnalysis, selectedXColumn, selectedYColumn) => {
  if (!statisticalAnalysis) return [];

  const insights = [];
  const { mean, median, standardDeviation, correlation, outliers, linearRegression, rSquared, range } = statisticalAnalysis;

  // Correlation insights
  if (Math.abs(correlation) > 0.7) {
    insights.push({
      type: 'correlation',
      severity: 'high',
      icon: <TrendingUp className="inline mr-2" size={18} />,
      title: `Strong ${correlation > 0 ? 'positive' : 'negative'} correlation detected (${correlation.toFixed(2)})`,
      message: correlation > 0 
        ? `As ${selectedXColumn} increases, ${selectedYColumn} tends to increase as well.`
        : `As ${selectedXColumn} increases, ${selectedYColumn} tends to decrease.`,
      recommendation: correlation > 0
        ? `Consider strategies that leverage this positive relationship.`
        : `Be aware of this inverse relationship in your planning.`
    });
  } else if (Math.abs(correlation) > 0.4) {
    insights.push({
      type: 'correlation',
      severity: 'medium',
      icon: <TrendingUp className="inline mr-2" size={18} />,
      title: `Moderate ${correlation > 0 ? 'positive' : 'negative'} correlation (${correlation.toFixed(2)})`,
      message: `There is a moderate relationship between ${selectedXColumn} and ${selectedYColumn}.`,
      recommendation: `Further investigation may reveal stronger patterns in specific segments.`
    });
  }

  // Outlier insights
  if (outliers && outliers.length > 0) {
    const outlierPercentage = (outliers.length / statisticalAnalysis.dataPoints * 100).toFixed(1);
    insights.push({
      type: 'outliers',
      severity: outliers.length > statisticalAnalysis.dataPoints * 0.1 ? 'high' : 'medium',
      icon: <AlertTriangle className="inline mr-2" size={18} />,
      title: `${outliers.length} outliers detected (${outlierPercentage}% of data)`,
      message: `These outliers may represent special cases or errors in data collection.`,
      recommendation: `Review these points individually to determine if they should be excluded or represent important events.`
    });
  }

  // Distribution insights
  if (Math.abs((mean.y - median.y) / standardDeviation.y) > 0.5) {
    insights.push({
      type: 'distribution',
      severity: 'medium',
      icon: <BarChart2 className="inline mr-2" size={18} />,
      title: `Skewed distribution detected`,
      message: `The data is ${mean.y > median.y ? 'right' : 'left'}-skewed, meaning ${mean.y > median.y ? 'higher' : 'lower'} values have more influence.`,
      recommendation: `Consider segmenting the data or using ${mean.y > median.y ? 'median' : 'weighted average'} for more representative analysis.`
    });
  }

  // Prediction confidence
  if (linearRegression && rSquared !== null) {
    const predictionQuality = rSquared > 0.7 ? 'high' : (rSquared > 0.4 ? 'moderate' : 'low');
    insights.push({
      type: 'prediction',
      severity: predictionQuality === 'high' ? 'high' : (predictionQuality === 'moderate' ? 'medium' : 'low'),
      icon: <Info className="inline mr-2" size={18} />,
      title: `${predictionQuality.charAt(0).toUpperCase() + predictionQuality.slice(1)} prediction confidence (R² = ${rSquared.toFixed(2)})`,
      message: `The current model explains ${(rSquared * 100).toFixed(0)}% of the variation in ${selectedYColumn}.`,
      recommendation: predictionQuality === 'high' 
        ? `This relationship is reliable for forecasting future values.`
        : (predictionQuality === 'moderate' 
            ? `Consider adding more variables for more accurate predictions.`
            : `More data or different variables are needed for reliable predictions.`)
    });
    
    // Future trend prediction
    if (linearRegression && range.x.length === 2) {
      const slope = linearRegression.m;
      const xRange = range.x[1] - range.x[0];
      const predictedYChange = slope * xRange;
      const percentChange = (predictedYChange / mean.y) * 100;
      
      if (Math.abs(percentChange) > 10) {
        insights.push({
          type: 'trend',
          severity: 'high',
          icon: <TrendingUp className="inline mr-2" size={18} />,
          title: `Significant ${slope > 0 ? 'upward' : 'downward'} trend detected`,
          message: `Based on current data, expect a ${Math.abs(percentChange).toFixed(0)}% ${slope > 0 ? 'increase' : 'decrease'} over similar time periods.`,
          recommendation: slope > 0 
            ? `Prepare for growth by scaling resources accordingly.`
            : `Develop strategies to address this declining trend.`
        });
      }
    }
  }

  // Time series specific insights
  if (timeSeriesAnalysis && timeSeriesAnalysis.seasonality && timeSeriesAnalysis.seasonality.score > 0.4) {
    insights.push({
      type: 'seasonality',
      severity: 'medium',
      icon: <Info className="inline mr-2" size={18} />,
      title: `Cyclical pattern detected`,
      message: `Your data shows repetitive patterns approximately every ${timeSeriesAnalysis.seasonality.period} data points.`,
      recommendation: `Account for these cycles in your planning and forecasting.`
    });
  }

  return insights;
}; 