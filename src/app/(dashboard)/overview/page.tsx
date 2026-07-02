// src/app/(dashboard)/overview/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Card, CardHeader, CardContent } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { ProgressBar } from '@/components/ui/ProgressBar/ProgressBar';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton/Skeleton';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Briefcase,
  GraduationCap,
  Megaphone,
  ArrowRight,
  Activity,
  Plus,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './Overview.module.css';

interface StatCounts {
  ACTIVE: number;
  DEFERRED: number;
  WITHDRAWN: number;
  JOINED: number;
  NO_SHOW: number;
}

interface ClaimCounts {
  UNCLAIMED: number;
  CLAIMED: number;
  DISPUTED: number;
}

interface RoleCounts {
  NINJA: number;
  DIGITAL: number;
  PRIME: number;
  OTHER: number;
}

interface AuditLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: {
    name: string;
    role: string;
  };
}

interface DashboardStats {
  status: StatCounts;
  claims: ClaimCounts;
  roles: RoleCounts;
  stages: Record<string, number>;
  atRiskCount: number;
  openDisputes: number;
  recentLogs: AuditLog[];
  joiningDates: Array<{ joiningDate: string }>;
}

interface Milestone {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'FLAGGED' | 'NOT_APPLICABLE' | 'OVERDUE';
  notes: string | null;
  completedAt: string | null;
  milestone: {
    stage: string;
    name: string;
    description: string | null;
    displayOrder: number;
    isRequired: boolean;
  };
}

interface ChecklistItem {
  id: string;
  type: string;
  status: string;
}

interface CandidateData {
  id: string;
  referenceId: string;
  name: string;
  qualification: string;
  specialization: string;
  selectedRole: string;
  claimStatus: string;
  currentStage: string;
  overallStatus: string;
  joiningDate: string | null;
  remarks: string | null;
  daysInStage: number;
  isAtRisk: boolean;
  milestones: Milestone[];
  checklistItems: ChecklistItem[];
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isPinned: boolean;
  publishedAt: string;
  author: {
    name: string;
  };
}

export default function OverviewPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isCandidate, setIsCandidate] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Announcement posting form (Admin/Coordinator only)
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState('NORMAL');
  const [annTarget, setAnnTarget] = useState('CANDIDATE');
  const [isPostingAnn, setIsPostingAnn] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/overview');
      const json = await res.json();

      if (json.success) {
        if (json.isCandidate) {
          setIsCandidate(true);
          setCandidate(json.data.candidate);
          setAnnouncements(json.data.announcements);
        } else {
          setIsCandidate(false);
          setStats(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Submit announcement
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    setIsPostingAnn(true);
    setPostError(null);
    try {
      // In Phase 5 we will build the full announcements router.
      // But we can create a placeholder or post to /api/announcements if we want.
      // Let's check: if there is no endpoint, we can build a simple route or show success.
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: annTitle.trim(),
          content: annContent.trim(),
          priority: annPriority,
          targetRoles: annTarget === 'ALL' ? null : annTarget,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setAnnTitle('');
        setAnnContent('');
        setAnnPriority('NORMAL');
        toast.success('Announcement published successfully!');
        fetchDashboardData();
      } else {
        setPostError(json.error || 'Failed to post announcement.');
      }
    } catch (err) {
      console.error(err);
      setPostError('Failed to publish announcement.');
    } finally {
      setIsPostingAnn(false);
    }
  };



  const getMilestoneBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'VERIFIED': return <Badge variant="success" glow>Verified</Badge>;
      case 'IN_PROGRESS': return <Badge variant="pending">In Progress</Badge>;
      case 'FLAGGED': return <Badge variant="error" glow>Flagged</Badge>;
      case 'OVERDUE': return <Badge variant="error">Overdue</Badge>;
      case 'NOT_APPLICABLE': return <Badge variant="neutral">N/A</Badge>;
      default: return <Badge variant="neutral">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <PageHeader title="Overview Dashboard" description="Loading metrics and stats..." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginTop: '24px' }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '24px' }}>
          <SkeletonTable rows={5} cols={5} />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // ─── RENDERING CANDIDATE PERSONAL OVERVIEW ───
  if (isCandidate && candidate) {
    const totalChecklist = candidate.checklistItems.length;
    const submittedChecklist = candidate.checklistItems.filter(
      (item) => ['SUBMITTED', 'VERIFIED_BY_TCS'].includes(item.status)
    ).length;
    const checklistPercent = totalChecklist > 0 ? Math.round((submittedChecklist / totalChecklist) * 100) : 0;

    return (
      <div className={styles.container}>
        <PageHeader
          title={`Welcome, ${candidate.name}`}
          description="Track your onboarding checkpoints, view document checklists, and read batch notifications."
          breadcrumbs={[{ label: 'Dashboard' }]}
        />

        {/* GREETING CARD */}
        <div className={styles.greetCard}>
          <div className={styles.greetTitle}>TCS Onboarding Portal</div>
          <div className={styles.greetDesc}>
            Your Campus Selection Offer has been registered. Claimed Reference ID: <strong>{candidate.referenceId}</strong>.
          </div>
          <div className={styles.greetMeta}>
            <span className={styles.metaItem}>
              <Briefcase size={14} />
              Offer Role: {candidate.selectedRole}
            </span>
            <span className={styles.metaItem}>
              <GraduationCap size={14} />
              {candidate.qualification} ({candidate.specialization})
            </span>
            <span className={styles.metaItem}>
              <Calendar size={14} />
              Confirmed Joining: {formatDate(candidate.joiningDate)}
            </span>
          </div>
        </div>

        <div className={styles.candidateLayout}>
          {/* LEFT: PERSONAL TIMELINE STEPPER */}
          <Card className={styles.timelineCard}>
            <CardHeader className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Your Milestone Stepper Progress</h3>
              {candidate.isAtRisk && (
                <Badge variant="error" glow>
                  <AlertTriangle size={12} style={{ marginRight: '4px' }} />
                  Action Required: Stuck for {candidate.daysInStage} days
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className={styles.personalTimeline}>
                {candidate.milestones.map((ms) => {
                  const isActive = candidate.currentStage === ms.milestone.stage;
                  const isFinished = ['COMPLETED', 'VERIFIED', 'NOT_APPLICABLE'].includes(ms.status);

                  return (
                    <div key={ms.id} className={styles.timelineStep}>
                      <div
                        className={`${styles.timelineDot} ${
                          isFinished ? styles.timelineDotFinished : isActive ? styles.timelineDotActive : ''
                        }`}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          className={`${styles.timelineStepTitle} ${
                            isFinished
                              ? styles.timelineStepTitleFinished
                              : isActive
                              ? styles.timelineStepTitleActive
                              : ''
                          }`}
                        >
                          {ms.milestone.name}
                        </span>
                        {getMilestoneBadge(ms.status)}
                      </div>
                      <span className={styles.timelineStepDesc}>
                        {ms.milestone.description || 'Stage initialized.'}
                      </span>
                      {ms.notes && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-secondary)',
                            background: 'rgba(255, 255, 255, 0.02)',
                            padding: '6px var(--space-3)',
                            borderLeft: '2px solid var(--color-primary-500)',
                            marginTop: '4px',
                          }}
                        >
                          <strong>Coordinator note:</strong> {ms.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* RIGHT: CHECKLIST PROGRESS & ANNOUNCEMENTS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* CHECKLIST SUMMARY CARD */}
            <Card>
              <CardHeader className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Document Submissions</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-primary-400)', fontWeight: 600 }}>
                  {submittedChecklist}/{totalChecklist} Submitted
                </span>
              </CardHeader>
              <CardContent>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                  Keep your document statuses verified by coordinators before your BGV begins.
                </p>
                <ProgressBar value={checklistPercent} />
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <Link href="/checklist">
                    <Button variant="ghost" size="sm">
                      Go to Checklist <ArrowRight size={14} style={{ marginLeft: '6px' }} />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* ANNOUNCEMENT BOARD */}
            <Card>
              <CardHeader className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Recent Batch Announcements</h3>
                <Megaphone size={16} style={{ color: 'var(--color-primary-400)' }} />
              </CardHeader>
              <CardContent>
                {announcements.length > 0 ? (
                  announcements.map((ann) => (
                    <div key={ann.id} className={`${styles.announcementItem} ${styles[`priority-${ann.priority}`]}`}>
                      <div className={styles.announcementHeader}>
                        <span className={styles.announcementTitle}>{ann.title}</span>
                        <Badge
                          variant={
                            ann.priority === 'URGENT'
                              ? 'error'
                              : ann.priority === 'HIGH'
                              ? 'warning'
                              : ann.priority === 'NORMAL'
                              ? 'info'
                              : 'neutral'
                          }
                        >
                          {ann.priority.toLowerCase()}
                        </Badge>
                      </div>
                      <p className={styles.announcementContent}>{ann.content}</p>
                      <span className={styles.announcementDate}>
                        Published by {ann.author.name} on {formatDate(ann.publishedAt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>No announcements posted for this batch.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDERING COORDINATOR/ADMIN BATCH DASHBOARD ───
  if (!stats) return null;

  const totalPool = stats.status.ACTIVE + stats.status.DEFERRED + stats.status.JOINED + stats.status.NO_SHOW;
  const claimedPercent = totalPool > 0 ? Math.round((stats.claims.CLAIMED / totalPool) * 100) : 0;

  // Pie chart data formatting
  const chartData = [
    { name: 'Ninja', value: stats.roles.NINJA, color: '#8B5CF6' },
    { name: 'Digital', value: stats.roles.DIGITAL, color: '#3B82F6' },
    { name: 'Prime', value: stats.roles.PRIME, color: '#10B981' },
    { name: 'Other', value: stats.roles.OTHER, color: '#64748B' },
  ].filter((d) => d.value > 0);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Batch Overview Dashboard"
        description="Monitor lokal college campus selectees pre-joining statistics, claim audits, and pending claims."
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          <div className={styles.actions}>
            <Link href="/analytics">
              <Button>
                <Activity size={16} style={{ marginRight: '8px' }} />
                Advanced Analytics
              </Button>
            </Link>
          </div>
        }
      />

      {/* METRIC CARDS GRID */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>
            <Users size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statVal}>{totalPool}</span>
            <span className={styles.statLabel}>Local Pool Candidates</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconSuccess}`}>
            <Clock size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statVal}>{claimedPercent}%</span>
            <span className={styles.statLabel}>Account Claim Rate</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconWarning}`}>
            <AlertTriangle size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statVal}>{stats.atRiskCount}</span>
            <span className={styles.statLabel}>Candidates At Risk</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconError}`}>
            <CheckCircle2 size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statVal}>{stats.status.JOINED}</span>
            <span className={styles.statLabel}>Confirmed Joined TCS</span>
          </div>
        </Card>
      </div>

      <div className={styles.dashboardLayout}>
        {/* LEFT PANEL: QUICK ACTIONS & ANNOUNCEMENT FORM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* QUICK ALERTS CARD */}
          <Card className={styles.glassCard}>
            <CardHeader className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Pending Batch Operations</h3>
              <Badge variant={stats.openDisputes > 0 ? 'error' : 'neutral'}>
                {stats.openDisputes} disputes
              </Badge>
            </CardHeader>
            <CardContent className={styles.alertsList}>
              {stats.openDisputes > 0 && (
                <div className={styles.alertItem}>
                  <div className={styles.alertMeta}>
                    <AlertTriangle className={`${styles.alertIcon} ${styles.alertIconDanger}`} size={16} />
                    <div>
                      <div className={styles.alertTitle}>Unresolved Disputes</div>
                      <div className={styles.alertDesc}>{stats.openDisputes} candidate(s) disputed their claimed IDs.</div>
                    </div>
                  </div>
                  <Link href="/settings">
                    <Button size="sm" variant="ghost">Resolve</Button>
                  </Link>
                </div>
              )}

              {stats.claims.UNCLAIMED > 0 && (
                <div className={styles.alertItem}>
                  <div className={styles.alertMeta}>
                    <Clock className={styles.alertIcon} size={16} />
                    <div>
                      <div className={styles.alertTitle}>Unclaimed Profiles</div>
                      <div className={styles.alertDesc}>{stats.claims.UNCLAIMED} candidates have not claim registered yet.</div>
                    </div>
                  </div>
                  <Link href="/candidates?claimStatus=UNCLAIMED">
                    <Button size="sm" variant="ghost">View</Button>
                  </Link>
                </div>
              )}

              {stats.atRiskCount > 0 && (
                <div className={styles.alertItem}>
                  <div className={styles.alertMeta}>
                    <AlertTriangle className={styles.alertIcon} size={16} />
                    <div>
                      <div className={styles.alertTitle}>At Risk Candidates</div>
                      <div className={styles.alertDesc}>{stats.atRiskCount} candidates exceeded their stage completion deadlines.</div>
                    </div>
                  </div>
                  <Link href="/milestones">
                    <Button size="sm" variant="ghost">Inspect</Button>
                  </Link>
                </div>
              )}

              {stats.openDisputes === 0 && stats.atRiskCount === 0 && (
                <div className={styles.emptyState}>No urgent operations pending for this batch.</div>
              )}
            </CardContent>
          </Card>

          {/* ANNOUNCEMENT CREATOR */}
          <Card className={styles.glassCard}>
            <CardHeader className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Publish Announcement</h3>
              <Megaphone size={16} style={{ color: 'var(--color-primary-400)' }} />
            </CardHeader>
            <CardContent>
              {postError && (
                <div
                  style={{
                    color: 'var(--color-error)',
                    background: 'rgba(239, 68, 68, 0.05)',
                    padding: '8px var(--space-3)',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    marginBottom: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                  }}
                >
                  {postError}
                </div>
              )}
              <form onSubmit={handlePostAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Input
                  label="Title"
                  placeholder="e.g. BGV Document Submission Deadline"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  required
                  disabled={isPostingAnn}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Content (Markdown Supported)</label>
                  <textarea
                    style={{
                      width: '100%',
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      padding: '10px',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.8125rem',
                      outline: 'none',
                    }}
                    rows={4}
                    placeholder="Provide details about BGV, medical reports or joining date guidelines..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    required
                    disabled={isPostingAnn}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Select
                    label="Priority"
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value)}
                    disabled={isPostingAnn}
                    options={[
                      { value: 'LOW', label: 'Low' },
                      { value: 'NORMAL', label: 'Normal' },
                      { value: 'HIGH', label: 'High' },
                      { value: 'URGENT', label: 'Urgent' },
                    ]}
                  />
                  <Select
                    label="Target Audience"
                    value={annTarget}
                    onChange={(e) => setAnnTarget(e.target.value)}
                    disabled={isPostingAnn}
                    options={[
                      { value: 'ALL', label: 'All Users' },
                      { value: 'CANDIDATE', label: 'Candidates Only' },
                      { value: 'COORDINATOR', label: 'Coordinators Only' },
                    ]}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <Button type="submit" isLoading={isPostingAnn}>
                    <Plus size={14} style={{ marginRight: '6px' }} />
                    Publish Broadcast
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL: ROLE DISTRIBUTION & RECENT ACTIVITY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* ROLE DISTRIBUTION DONUT */}
          <Card className={styles.glassCard}>
            <CardHeader className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Offer Role Distribution</h3>
              <Users size={16} style={{ color: 'var(--color-primary-400)' }} />
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--color-bg-card)',
                          borderColor: 'var(--color-border)',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={styles.emptyState}>No candidate records seeded to map roles.</div>
              )}
            </CardContent>
          </Card>

          {/* RECENT SECURITY LOGS */}
          <Card className={styles.glassCard}>
            <CardHeader className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Recent Operations Audit Trail</h3>
              <Activity size={16} style={{ color: 'var(--color-primary-400)' }} />
            </CardHeader>
            <CardContent className={styles.logsList}>
              {stats.recentLogs && stats.recentLogs.length > 0 ? (
                stats.recentLogs.map((log) => (
                  <div key={log.id} className={styles.logItem}>
                    <div className={styles.logHeader}>
                      <span className={styles.logUser}>
                        {log.user.name} ({log.user.role.toLowerCase()})
                      </span>
                      <span>{formatDate(log.createdAt)}</span>
                    </div>
                    <span className={styles.logAction}>{log.action.replace(/_/g, ' ')}</span>
                    <span className={styles.logDetails}>
                      {log.details ? log.details.slice(0, 100) : '-'}
                    </span>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>No audit history logged in database yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
