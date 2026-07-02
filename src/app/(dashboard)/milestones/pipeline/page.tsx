// src/app/(dashboard)/milestones/pipeline/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Button } from '@/components/ui/Button/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card/Card';
import {
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from '@/components/ui/Table/Table';
import {
  Kanban,
  Users,
  TrendingUp,
  Info,
  ChevronDown,
} from 'lucide-react';
import styles from './Pipeline.module.css';

interface FunnelStageData {
  stage: string;
  name: string;
  displayOrder: number;
  count: number;
  conversionRate: number;
  transitionRate: number;
  dropoffCount: number;
  dropoffRate: number;
}

interface AnalyticsResponse {
  totalActive: number;
  funnel: FunnelStageData[];
}

export default function PipelinePage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFunnelData() {
      try {
        const res = await fetch('/api/analytics/pipeline');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Error fetching pipeline analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFunnelData();
  }, []);

  const totalActive = data?.totalActive ?? 0;
  const funnel = data?.funnel ?? [];

  // Find final conversion rate (Day-1 Joining conversion)
  const finalStage = funnel[funnel.length - 1];
  const overallConversion = finalStage ? finalStage.conversionRate : 0;

  // Render funnel colors dynamically
  const getBarColorGradient = (order: number) => {
    // Generate hues between primary Indigo (220) and Accent Magenta (320)
    const totalStages = funnel.length || 8;
    const hue = 220 + (order - 1) * ((320 - 220) / (totalStages - 1 || 1));
    return `linear-gradient(90deg, hsl(${hue}, 80%, 45%) 0%, hsl(${hue}, 80%, 60%) 100%)`;
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="Pipeline Conversion Funnel"
        description="View cumulative candidate flows, stage-by-stage drop-off analytics, and transition rates."
        breadcrumbs={[
          { label: 'Dashboard', href: '/overview' },
          { label: 'Milestones', href: '/milestones' },
          { label: 'Pipeline' },
        ]}
        actions={
          <div className={styles.actions}>
            <Link href="/milestones">
              <Button variant="outline">
                <Kanban size={16} style={{ marginRight: '8px' }} />
                Kanban board
              </Button>
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className={styles.loadingContainer}>
          <p>Loading pipeline analytics...</p>
        </div>
      ) : funnel.length > 0 ? (
        <>
          {/* STATS OVERVIEW CARDS */}
          <div className={styles.statsGrid}>
            <Card className={styles.metricCard}>
              <div className={styles.metricIcon}>
                <Users size={24} />
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricVal}>{totalActive}</span>
                <span className={styles.metricLabel}>Total Active Pipeline Candidates</span>
              </div>
            </Card>

            <Card className={styles.metricCard}>
              <div className={`${styles.metricIcon} ${styles.metricIconSuccess}`}>
                <TrendingUp size={24} />
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricVal}>{overallConversion}%</span>
                <span className={styles.metricLabel}>Overall Day-1 Joining Rate</span>
              </div>
            </Card>
          </div>

          <div className={styles.analyticsGrid}>
            {/* LEFT: VISUAL FUNNEL */}
            <Card className={styles.funnelCard}>
              <CardHeader className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Visual Conversion Pipeline</h3>
              </CardHeader>
              <CardContent>
                <div className={styles.funnelChartContainer}>
                  {funnel.map((item, index) => {
                    // Normalize bar width relative to the first stage (capped to min 28% for text layout spacing)
                    const normalizedWidth = Math.max(28, item.conversionRate);

                    return (
                      <div key={item.stage} className={styles.funnelStage}>
                        <div
                          className={styles.funnelBar}
                          style={{
                            width: `${normalizedWidth}%`,
                            background: getBarColorGradient(item.displayOrder),
                          }}
                        >
                          <div className={styles.funnelBarGlow} />
                          <span className={styles.stageName} title={item.name}>
                            {item.name}
                          </span>
                          <div className={styles.stageMetrics}>
                            <span className={styles.stageCount}>{item.count}</span>
                            <span className={styles.stagePercentage}>
                              ({item.conversionRate}%)
                            </span>
                          </div>
                        </div>

                        {/* Dropoff indicator between stages */}
                        {index < funnel.length - 1 && (
                          <div className={styles.dropoffConnector}>
                            {funnel[index + 1].dropoffCount > 0 ? (
                              <div className={styles.dropoffArrow}>
                                <ChevronDown size={11} />
                                {funnel[index + 1].dropoffCount} drop-off ({funnel[index + 1].dropoffRate}%)
                              </div>
                            ) : (
                              <div className={styles.noDropoff}>
                                0 drop-off (0%)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* RIGHT: CONVERSION DATA TABLE */}
            <Card className={styles.tableCard}>
              <CardHeader className={styles.cardHeader}>
                <h3 className={styles.cardTitle}> Funnel Conversion Data</h3>
              </CardHeader>
              <CardContent style={{ padding: 0 }}>
                <div className={styles.tableContainer}>
                  <Table>
                    <THead>
                      <TR>
                        <TH>Milestone</TH>
                        <TH style={{ textAlign: 'center' }}>Count</TH>
                        <TH style={{ textAlign: 'center' }}>Conv. %</TH>
                        <TH style={{ textAlign: 'center' }}>Trans. %</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {funnel.map((item) => (
                        <TR key={item.stage}>
                          <TD style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                            {item.name}
                          </TD>
                          <TD className={styles.mono} style={{ textAlign: 'center' }}>
                            {item.count}
                          </TD>
                          <TD className={styles.mono} style={{ textAlign: 'center', color: 'var(--color-success)' }}>
                            {item.conversionRate}%
                          </TD>
                          <TD className={styles.mono} style={{ textAlign: 'center', color: 'var(--color-info)' }}>
                            {item.transitionRate}%
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-secondary)' }}>
            <Info size={40} style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }} />
            <h3>No Analytics Data</h3>
            <p>Milestone definitions must be seeded to run pipeline calculations.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
