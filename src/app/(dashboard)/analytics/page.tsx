// src/app/(dashboard)/analytics/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Card, CardHeader, CardContent } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Users,
  ShieldAlert,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import styles from './Analytics.module.css';

interface MilestoneDefinition {
  id: string;
  stage: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isRequired: boolean;
}

interface CandidateMilestone {
  milestoneId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'FLAGGED' | 'NOT_APPLICABLE' | 'OVERDUE';
  notes: string | null;
}

interface HeatmapCandidate {
  id: string;
  referenceId: string;
  name: string;
  selectedRole: 'NINJA' | 'DIGITAL' | 'PRIME' | 'OTHER';
  currentStage: string | null;
  milestones: CandidateMilestone[];
}

interface HeatmapData {
  definitions: MilestoneDefinition[];
  candidates: HeatmapCandidate[];
}

interface OverviewData {
  status: {
    ACTIVE: number;
    DEFERRED: number;
    WITHDRAWN: number;
    JOINED: number;
    NO_SHOW: number;
  };
  claims: {
    UNCLAIMED: number;
    CLAIMED: number;
    DISPUTED: number;
  };
  roles: {
    NINJA: number;
    DIGITAL: number;
    PRIME: number;
    OTHER: number;
  };
  stages: Record<string, number>;
  atRiskCount: number;
  openDisputes: number;
  joiningDates: Array<{ joiningDate: string }>;
}

export default function AnalyticsPage() {
  const { data: session, status: sessionStatus } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [heatmapRes, overviewRes] = await Promise.all([
        fetch('/api/analytics/heatmap'),
        fetch('/api/analytics/overview'),
      ]);

      const heatmapJson = await heatmapRes.json();
      const overviewJson = await overviewRes.json();

      if (!heatmapRes.ok || !heatmapJson.success) {
        throw new Error(heatmapJson.error || 'Failed to fetch heatmap data.');
      }
      if (!overviewRes.ok || !overviewJson.success) {
        throw new Error(overviewJson.error || 'Failed to fetch overview metrics.');
      }

      setHeatmapData(heatmapJson.data);
      setOverviewData(overviewJson.data);
    } catch (err: unknown) {
      console.error(err);
      setFetchError(err instanceof Error ? err.message : 'An unexpected error occurred while loading analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session && (session.user.role === 'ADMIN' || session.user.role === 'COORDINATOR')) {
      fetchAnalyticsData();
    }
  }, [session, fetchAnalyticsData]);

  // Group and sort joining dates for Recharts AreaChart
  const joiningTrendData = useMemo(() => {
    if (!overviewData?.joiningDates || overviewData.joiningDates.length === 0) return [];

    const dateGroups: Record<string, number> = {};
    overviewData.joiningDates.forEach((cand) => {
      if (cand.joiningDate) {
        const d = new Date(cand.joiningDate);
        const dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        dateGroups[dateStr] = (dateGroups[dateStr] || 0) + 1;
      }
    });

    const sortedDateKeys = Object.keys(dateGroups).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    let cumulative = 0;
    return sortedDateKeys.map((dateStr) => {
      const count = dateGroups[dateStr];
      cumulative += count;
      return {
        date: dateStr,
        'Expected to Join': count,
        'Cumulative Expected': cumulative,
      };
    });
  }, [overviewData?.joiningDates]);

  // Filter candidates client-side
  const filteredCandidates = useMemo(() => {
    if (!heatmapData?.candidates) return [];

    return heatmapData.candidates.filter((cand) => {
      const matchesSearch =
        cand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cand.referenceId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'ALL' || cand.selectedRole === roleFilter;
      
      const matchesStage = stageFilter === 'ALL' || cand.currentStage === stageFilter;

      return matchesSearch && matchesRole && matchesStage;
    });
  }, [heatmapData?.candidates, searchQuery, roleFilter, stageFilter]);

  // Helper to resolve milestone cell status class and text
  const getCellStatusClass = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return styles.statusCompleted;
      case 'VERIFIED':
        return styles.statusVerified;
      case 'IN_PROGRESS':
        return styles.statusInProgress;
      case 'FLAGGED':
      case 'OVERDUE':
        return styles.statusFlagged;
      case 'NOT_APPLICABLE':
        return styles.statusNotApplicable;
      default:
        return styles.statusPending;
    }
  };

  const getCellStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Completed';
      case 'VERIFIED': return 'Verified (TCS)';
      case 'IN_PROGRESS': return 'In Progress';
      case 'FLAGGED': return 'Flagged';
      case 'OVERDUE': return 'Overdue';
      case 'NOT_APPLICABLE': return 'N/A';
      default: return 'Pending';
    }
  };

  // 1. Session Auth Loading State
  if (sessionStatus === 'loading') {
    return (
      <div className={styles.container}>
        <PageHeader title="Advanced Analytics" description="Verifying credentials..." />
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--color-text-secondary)' }}>
          <p>Verifying user authorization context...</p>
        </div>
      </div>
    );
  }

  // 2. Access Denied (Candidate Role)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR')) {
    return (
      <div className={styles.accessDeniedContainer}>
        <div className={styles.accessDeniedCard}>
          <div className={styles.accessDeniedTitle}>
            <ShieldAlert size={28} />
            Access Denied
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: '1.5' }}>
            The Advanced Analytics dashboard, predictions, and progress heatmap are restricted to Batch Coordinators and Administrators only.
          </p>
          <Link href="/overview" style={{ marginTop: '8px' }}>
            <Button>
              <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Loading API Data State
  if (loading) {
    return (
      <div className={styles.container}>
        <PageHeader title="Advanced Analytics" description="Compiling candidate metrics and pre-joining trends..." />
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--color-text-secondary)' }}>
          <p>Gathering milestone matrices & computing trend data...</p>
        </div>
      </div>
    );
  }

  // 4. API Fetch Error State
  if (fetchError || !heatmapData || !overviewData) {
    return (
      <div className={styles.container}>
        <PageHeader title="Advanced Analytics" description="Analytics retrieval error" />
        <Card>
          <CardContent style={{ textAlign: 'center', padding: '50px 20px' }}>
            <AlertTriangle size={32} style={{ color: 'var(--color-error)', marginBottom: '12px' }} />
            <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>Failed to Load Data</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>
              {fetchError || 'Unable to communicate with the analytics endpoints.'}
            </p>
            <Button onClick={fetchAnalyticsData}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Count metrics for quick-cards
  const totalCandidates = heatmapData.candidates.length;
  const joinedCount = overviewData.status.JOINED;
  const atRiskCount = overviewData.atRiskCount;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Advanced Analytics & Reports"
        description="View cumulative onboarding joining projections, filter candidate rows, and inspect the milestone status heatmap."
        breadcrumbs={[{ label: 'Dashboard', href: '/overview' }, { label: 'Analytics' }]}
      />

      {/* TOP CHARTS & QUICK METRICS SECTION */}
      <div className={styles.topSection}>
        {/* JOINING TREND LINE/AREA CHART */}
        <Card className={styles.chartCard}>
          <CardHeader className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>
                <TrendingUp size={16} style={{ color: 'var(--color-primary-400)' }} />
                Onboarding Joining Trend
              </h3>
              <p className={styles.cardDesc}>Predicted joining projections compiled from confirmed joining dates</p>
            </div>
          </CardHeader>
          <div className={styles.chartContainer}>
            {joiningTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={joiningTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary-500)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary-500)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={11} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} />
                  <RechartsTooltip
                    contentStyle={{
                      background: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.75rem',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="Cumulative Expected"
                    stroke="var(--color-primary-400)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCumulative)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Expected to Join"
                    stroke="var(--color-success)"
                    strokeWidth={1.5}
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyState}>No candidate records with expected joining dates are seeded.</div>
            )}
          </div>
        </Card>

        {/* METRIC COUNTS COLLATERAL */}
        <div className={styles.metricsCol}>
          <div className={styles.miniCard}>
            <div className={`${styles.miniIcon} ${styles.miniIconPrimary}`}>
              <Users size={18} />
            </div>
            <div className={styles.miniContent}>
              <span className={styles.miniVal}>{totalCandidates}</span>
              <span className={styles.miniLabel}>Total Active Candidates</span>
            </div>
          </div>

          <div className={styles.miniCard}>
            <div className={`${styles.miniIcon} ${styles.miniIconSuccess}`}>
              <CheckCircle2 size={18} />
            </div>
            <div className={styles.miniContent}>
              <span className={styles.miniVal}>{joinedCount}</span>
              <span className={styles.miniLabel}>Confirmed Joined (TCS)</span>
            </div>
          </div>

          <div className={styles.miniCard}>
            <div className={`${styles.miniIcon} ${styles.miniIconWarning}`}>
              <AlertTriangle size={18} />
            </div>
            <div className={styles.miniContent}>
              <span className={styles.miniVal}>{atRiskCount}</span>
              <span className={styles.miniLabel}>Exceeded Stage Deadlines</span>
            </div>
          </div>
        </div>
      </div>

      {/* HEATMAP INTERACTIVE DATAGRID SECTION */}
      <div className={styles.heatmapSection}>
        <Card className={styles.chartCard}>
          <CardHeader className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>
                <Activity size={16} style={{ color: 'var(--color-success)' }} />
                Candidates Onboarding Progress Heatmap
              </h3>
              <p className={styles.cardDesc}>Complete matrix of active candidates and their milestone status indicators</p>
            </div>
          </CardHeader>
          <CardContent style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            
            {/* CONTROLS & FILTERS */}
            <div className={styles.heatmapControls}>
              <div className={styles.searchBox}>
                <Input
                  placeholder="Search by name or reference ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'All Roles' },
                    { value: 'PRIME', label: 'Prime' },
                    { value: 'DIGITAL', label: 'Digital' },
                    { value: 'NINJA', label: 'Ninja' },
                    { value: 'OTHER', label: 'Other' },
                  ]}
                />
                
                <Select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'All Active Stages' },
                    ...heatmapData.definitions.map((def) => ({
                      value: def.stage,
                      label: def.name,
                    })),
                  ]}
                />
              </div>
            </div>

            {/* HEATMAP CELL LEGEND */}
            <div className={styles.legendList}>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#10B981', boxShadow: '0 0 4px #10B981' }} />
                Completed / Verified
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#F59E0B', boxShadow: '0 0 4px #F59E0B' }} />
                In Progress
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#EF4444', boxShadow: '0 0 4px #EF4444' }} />
                Flagged / Overdue
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: 'rgba(71, 85, 105, 0.3)' }} />
                Pending / N/A
              </div>
            </div>

            {/* THE SCROLLABLE GRID TABLE */}
            <div className={styles.heatmapContainer}>
              {filteredCandidates.length > 0 ? (
                <table className={styles.heatmapTable}>
                  <thead>
                    <tr>
                      <th style={{ position: 'sticky', left: 0, zIndex: 3, background: 'rgba(18, 22, 35, 0.95)', borderRight: '1px solid var(--color-border)' }}>Candidate Details</th>
                      <th style={{ borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>Offer Role</th>
                      {heatmapData.definitions.map((def) => (
                        <th key={def.id} className={styles.milestoneColHeader}>
                          {def.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.map((cand) => (
                      <tr key={cand.id}>
                        {/* Candidate Name & Ref Sticky Column */}
                        <td style={{
                          position: 'sticky',
                          left: 0,
                          zIndex: 1,
                          background: 'rgba(26, 31, 46, 0.95)',
                          borderRight: '1px solid var(--color-border)',
                          fontWeight: 600
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: 'var(--color-text-primary)' }}>{cand.name}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{cand.referenceId}</span>
                          </div>
                        </td>

                        {/* Selected Role Badge column */}
                        <td style={{ borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <Badge
                            variant={
                              cand.selectedRole === 'PRIME'
                                ? 'success'
                                : cand.selectedRole === 'DIGITAL'
                                ? 'info'
                                : cand.selectedRole === 'NINJA'
                                ? 'pending'
                                : 'neutral'
                            }
                          >
                            {cand.selectedRole.toLowerCase()}
                          </Badge>
                        </td>

                        {/* Milestone Matrix Cells */}
                        {heatmapData.definitions.map((def) => {
                          const candMs = cand.milestones.find((m) => m.milestoneId === def.id);
                          const status = candMs ? candMs.status : 'PENDING';
                          const notes = candMs ? candMs.notes : null;

                          return (
                            <td key={def.id} className={styles.milestoneCell}>
                              <div className={`${styles.statusIndicator} ${getCellStatusClass(status)}`}>
                                {/* CSS Tooltip markup */}
                                <div className={styles.tooltip}>
                                  <div className={styles.tooltipTitle}>{def.name}</div>
                                  <div className={styles.tooltipStatus}>
                                    Status: {getCellStatusLabel(status)}
                                  </div>
                                  {notes && (
                                    <div className={styles.tooltipNotes}>
                                      <strong>Notes:</strong> {notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>No candidates found matching filters.</div>
              )}
            </div>

            {/* Total Results Counter */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Showing {filteredCandidates.length} of {totalCandidates} candidates
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
