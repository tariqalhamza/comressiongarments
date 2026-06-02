import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
} from 'recharts';

const garmentData = [
  { name: 'Socks', value: 400 },
  { name: 'Sleeves', value: 300 },
  { name: 'Gloves', value: 300 },
  { name: 'Leggings', value: 200 },
];

const COLORS = ['#2563eb', '#7c3aed', '#10b981', '#f59e0b'];

const conditionData = [
  { name: 'Patient Registration', count: 120 },
  { name: 'CVI', count: 98 },
  { name: 'Post-Surgical', count: 45 },
  { name: 'Burn Pressure', count: 23 },
];

const Analytics: React.FC = () => {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Garment Distribution */}
        <div className="medical-card p-8">
          <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-8">Garment Type Distribution</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={garmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {garmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Common Conditions */}
        <div className="medical-card p-8">
          <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-8">Medical Diagnosis Overview</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conditionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={100} />
                <Tooltip 
                   cursor={{fill: 'transparent'}}
                   contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[0, 10, 10, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
