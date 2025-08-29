"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/design";

interface TrendChartProps {
  radarId: string;
}

export default function TrendChart({ radarId }: TrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Mock data for demonstration
  const data = {
    labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Today'],
    datasets: [
      {
        label: 'For',
        data: [30, 35, 42, 48, 52, 58, 65],
        color: 'rgb(34, 197, 94)', // green-500
      },
      {
        label: 'Against',
        data: [45, 43, 38, 35, 32, 28, 25],
        color: 'rgb(239, 68, 68)', // red-500
      },
      {
        label: 'Neutral',
        data: [25, 22, 20, 17, 16, 14, 10],
        color: 'rgb(120, 113, 108)', // stone-500
      },
    ],
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Chart dimensions
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;
    const stepX = chartWidth / (data.labels.length - 1);
    const maxValue = 100;

    // Draw grid lines
    ctx.strokeStyle = '#e7e5e4'; // stone-200
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw datasets
    data.datasets.forEach((dataset) => {
      ctx.strokeStyle = dataset.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      dataset.data.forEach((value, index) => {
        const x = padding + stepX * index;
        const y = padding + chartHeight - (value / maxValue) * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw points
      ctx.fillStyle = dataset.color;
      dataset.data.forEach((value, index) => {
        const x = padding + stepX * index;
        const y = padding + chartHeight - (value / maxValue) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Draw labels
    ctx.fillStyle = '#57534e'; // stone-600
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';

    data.labels.forEach((label, index) => {
      const x = padding + stepX * index;
      const y = rect.height - 10;
      ctx.fillText(label, x, y);
    });

    // Draw Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = (100 / 4) * (4 - i);
      const y = padding + (chartHeight / 4) * i + 4;
      ctx.fillText(`${value}%`, padding - 10, y);
    }
  }, [radarId]);

  return (
    <Card className="yutori-card">
      <CardHeader>
        <CardTitle>Opinion Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-64"
            style={{ height: '256px' }}
          />
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          {data.datasets.map((dataset) => (
            <div key={dataset.label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: dataset.color }}
              />
              <span className="text-sm yutori-text-muted">{dataset.label}</span>
            </div>
          ))}
        </div>
        
        {/* Current Status */}
        <div className="mt-4 p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
          <p className="text-sm text-center">
            <span className="font-medium">Current Consensus:</span>{' '}
            <span className="text-green-600 dark:text-green-400 font-medium">
              65% For
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}