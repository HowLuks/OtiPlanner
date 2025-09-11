'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export interface DonutChartCell {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartCell[];
}

export function DonutChart({ data }: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip
            contentStyle={{
                background: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)",
            }}
            formatter={(value, name, props) => {
                const total = data.reduce((acc, cur) => acc + cur.value, 0);
                const percentage = total > 0 ? (Number(value) / total) * 100 : 0;
                return `${percentage.toFixed(0)}%`;
            }}
        />
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          fill="#8884d8"
          paddingAngle={0}
          dataKey="value"
          stroke="hsl(var(--background))"
          strokeWidth={4}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
