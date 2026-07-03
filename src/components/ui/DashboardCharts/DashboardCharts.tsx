'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import styles from '@/app/page.module.css';
import { useTheme } from '@/context/ThemeContext';

type DashboardChartsProps = {
  stats: {
    totalCandidates: number;
    claimedProfiles: number;
    offerLetters: number;
    jrsAssigned: number;
    bgcStarted: number;
    joiningLetters: number;
    primeRole: number;
    digitalRole: number;
    ninjaRole: number;
    onCampus: number;
    offCampus: number;
  };
};

// TCS Brand Colors
const COLORS = {
  indigo: '#477AC6',
  navy: '#003057',
  gray: '#8D8D8D',
  white: '#FFFFFF',
  accent1: '#5FA3EB', // Light Blue
  accent2: '#477AC6', // Indigo
  accent3: '#93C5FD', // Very Light Blue
};

export default function DashboardCharts({ stats }: DashboardChartsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  // Funnel Data
  const funnelData = [
    { name: 'Total Candidates', count: stats.totalCandidates },
    { name: 'Profiles Claimed', count: stats.claimedProfiles },
    { name: 'Offer Letters', count: stats.offerLetters },
    { name: 'JRS Sessions', count: stats.jrsAssigned },
    { name: 'BGC Started', count: stats.bgcStarted },
    { name: 'Joining Letters', count: stats.joiningLetters },
  ];

  // Role Data
  const roleData = [
    { name: 'Prime', value: stats.primeRole },
    { name: 'Digital', value: stats.digitalRole },
    { name: 'Ninja', value: stats.ninjaRole },
  ];
  const ROLE_COLORS = [COLORS.accent2, COLORS.indigo, COLORS.accent3];

  // Campus Data
  const campusData = [
    { name: 'On Campus', value: stats.onCampus },
    { name: 'Off Campus', value: stats.offCampus },
    { name: 'Unspecified', value: stats.totalCandidates - stats.onCampus - stats.offCampus },
  ].filter(d => d.value > 0);
  const CAMPUS_COLORS = [COLORS.indigo, COLORS.accent1, COLORS.gray];

  // Custom tooltip style for Light/Dark Mode
  const customTooltipStyle = {
    backgroundColor: isDark ? '#121212' : '#FFFFFF',
    border: `1px solid ${COLORS.indigo}`,
    borderRadius: '8px',
    color: isDark ? '#fff' : '#111',
    padding: '10px'
  };

  const axisColor = isDark ? '#8D8D8D' : '#475569';
  const gridColor = isDark ? '#333' : '#e2e8f0';
  const legendColor = isDark ? '#fff' : '#0D0D0D';

  return (
    <div className={styles.chartsContainer}>
      
      {/* Funnel Chart - Full Width */}
      <div className={styles.chartCardFull}>
        <h3 className={styles.chartTitle}>Onboarding Funnel</h3>
        <p className={styles.chartSubtitle}>Progress from total candidates to final joining letters</p>
        <div style={{ width: '100%', height: 350, marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={funnelData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" stroke={axisColor} tick={{ fill: axisColor }} />
              <YAxis stroke={axisColor} tick={{ fill: axisColor }} />
              <Tooltip 
                contentStyle={customTooltipStyle} 
                itemStyle={{ color: COLORS.accent2 }}
                cursor={{ fill: isDark ? '#ffffff0a' : '#0000000a' }}
              />
              <Bar 
                dataKey="count" 
                fill={COLORS.indigo} 
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        {/* Role Donut Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Role Breakdown</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} stroke="rgba(0,0,0,0)" />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: legendColor }} />
                <Legend wrapperStyle={{ color: legendColor, paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campus Pie Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Campus Distribution</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={campusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {campusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CAMPUS_COLORS[index % CAMPUS_COLORS.length]} stroke="rgba(0,0,0,0)" />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: legendColor }} />
                <Legend wrapperStyle={{ color: legendColor, paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
    </div>
  );
}
