import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TrendChart({ trends }) {
  if (!trends || !trends.labels || trends.labels.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 p-6 text-center">
        <p className="font-medium text-sm">No screening history trends recorded yet.</p>
        <p className="text-xs text-slate-500 mt-1">Complete your first screening to track score changes over time.</p>
      </div>
    );
  }

  const data = {
    labels: trends.labels,
    datasets: [
      {
        label: 'GAD-7 Anxiety',
        data: trends.anxietyScores,
        borderColor: '#0d9488', // teal-600
        backgroundColor: 'rgba(13, 148, 136, 0.12)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#0d9488',
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'PHQ-9 Depression',
        data: trends.depressionScores,
        borderColor: '#6366f1', // indigo-500
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#6366f1',
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          font: { size: 12, family: 'Inter, sans-serif', weight: '500' },
          color: '#475569'
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        min: 0,
        max: 27,
        ticks: {
          stepSize: 5,
          color: '#94a3b8'
        },
        grid: {
          color: '#f1f5f9'
        }
      },
      x: {
        ticks: {
          color: '#94a3b8'
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="h-72 w-full">
      <Line data={data} options={options} />
    </div>
  );
}
