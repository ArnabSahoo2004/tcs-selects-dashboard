// src/app/(dashboard)/milestones/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Button } from '@/components/ui/Button/Button';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { Select } from '@/components/ui/Select/Select';
import { Badge } from '@/components/ui/Badge/Badge';
import { useSession } from 'next-auth/react';
import {
  Search,
  Clock,
  AlertTriangle,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import styles from './Kanban.module.css';

interface MilestoneDefinition {
  id: string;
  stage: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isRequired: boolean;
  deadlineDays: number | null;
}

interface Candidate {
  id: string;
  referenceId: string;
  name: string;
  selectedRole: 'PRIME' | 'DIGITAL' | 'NINJA' | 'OTHER';
  claimStatus: 'UNCLAIMED' | 'CLAIMED' | 'DISPUTED';
  currentStage: string;
  overallStatus: 'ACTIVE' | 'DEFERRED' | 'WITHDRAWN' | 'JOINED' | 'NO_SHOW';
  daysInStage: number;
  isAtRisk: boolean;
}

export default function KanbanPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const userRole = session?.user?.role || 'CANDIDATE';
  const isCoordinatorOrAdmin = userRole === 'ADMIN' || userRole === 'COORDINATOR';

  // State
  const [stages, setStages] = useState<MilestoneDefinition[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');

  // Drag-and-drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeDropStage, setActiveDropStage] = useState<string | null>(null);
  const [updatingCandidateId, setUpdatingCandidateId] = useState<string | null>(null);

  // Fetch Definitions and Candidates
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [stagesRes, candidatesRes] = await Promise.all([
        fetch('/api/milestones'),
        fetch('/api/candidates?pageSize=500'), // Large page size to retrieve all candidates
      ]);

      const stagesJson = await stagesRes.json();
      const candidatesJson = await candidatesRes.json();

      if (stagesJson.success) {
        setStages(stagesJson.data);
      }
      if (candidatesJson.success) {
        // Exclude withdrawn candidates from Kanban board
        const activeCandidates = candidatesJson.data.filter(
          (c: Candidate) => c.overallStatus !== 'WITHDRAWN'
        );
        setCandidates(activeCandidates);
      }
    } catch (err) {
      console.error('Failed to load Kanban board data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // HTML5 drag start handler
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!isCoordinatorOrAdmin) {
      e.preventDefault();
      return;
    }
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // HTML5 drag over handler
  const handleDragOver = (e: React.DragEvent, stage: string) => {
    if (!isCoordinatorOrAdmin) return;
    e.preventDefault();
    if (activeDropStage !== stage) {
      setActiveDropStage(stage);
    }
  };

  // HTML5 drag leave handler
  const handleDragLeave = () => {
    setActiveDropStage(null);
  };

  // HTML5 drop handler
  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    if (!isCoordinatorOrAdmin) return;
    e.preventDefault();
    
    const candidateId = e.dataTransfer.getData('text/plain') || draggedId;
    setDraggedId(null);
    setActiveDropStage(null);

    if (!candidateId) return;

    // Find the candidate
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    // Avoid redundant API calls if stage hasn't changed
    if (candidate.currentStage === targetStage) return;

    // Store original stage for rollback on failure
    const originalStage = candidate.currentStage;

    // Optimistic UI update
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, currentStage: targetStage } : c))
    );
    setUpdatingCandidateId(candidateId);

    try {
      const res = await fetch('/api/milestones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, stage: targetStage }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update candidate stage');
      }
      
      toast.success('Milestone stage updated successfully.');

      // Refresh list to pull updated milestone statuses and calculated risk metrics
      const refreshRes = await fetch('/api/candidates?pageSize=500');
      const refreshJson = await refreshRes.json();
      if (refreshJson.success) {
        const activeCandidates = refreshJson.data.filter(
          (c: Candidate) => c.overallStatus !== 'WITHDRAWN'
        );
        setCandidates(activeCandidates);
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to update stage.');
      
      // Rollback optimistic update
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, currentStage: originalStage } : c))
      );
    } finally {
      setUpdatingCandidateId(null);
    }
  };

  // Filter candidates matching search and offer roles
  const filteredCandidates = candidates.filter((cand) => {
    const matchesSearch =
      cand.name.toLowerCase().includes(search.toLowerCase()) ||
      cand.referenceId.toLowerCase().includes(search.toLowerCase());
    const matchesRole = role === 'ALL' || cand.selectedRole === role;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'PRIME': return 'success';
      case 'DIGITAL': return 'info';
      case 'NINJA': return 'pending';
      default: return 'neutral';
    }
  };

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="Onboarding Kanban Board"
        description="Monitor pre-joining pipeline flow, drag candidates to advance stages, and check days in status."
        breadcrumbs={[{ label: 'Dashboard', href: '/overview' }, { label: 'Milestones' }]}
        actions={
          <div className={styles.actions}>
            <Link href="/milestones/pipeline">
              <Button variant="outline">
                <FileCheck size={16} style={{ marginRight: '8px' }} />
                Pipeline Funnel View
              </Button>
            </Link>
          </div>
        }
      />

      {/* FILTER PANEL */}
      <Card className={styles.filterCard}>
        <CardContent className={styles.filterCardContent}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by candidate name or Reference ID (CT/DT)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.selectWrapper}>
            <Select
              label="Approved Offer Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Offers' },
                { value: 'PRIME', label: 'Prime' },
                { value: 'DIGITAL', label: 'Digital' },
                { value: 'NINJA', label: 'Ninja' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* KANBAN LAYOUT CONTAINER */}
      <div className={styles.kanbanWrapper}>
        <div className={styles.boardContainer}>
          {loading ? (
            // Loading skeleton columns
            Array.from({ length: 4 }).map((_, i) => (
              <div key={`skeleton-col-${i}`} className={styles.column} style={{ minHeight: '400px' }}>
                <div className={styles.columnHeader}>
                  <div className={styles.columnHeaderTitle}>Loading stage...</div>
                  <div className={styles.columnCount}>-</div>
                </div>
                <div className={styles.cardsContainer}>
                  <div className={styles.emptyColumn}>Loading candidates...</div>
                </div>
              </div>
            ))
          ) : stages.length > 0 ? (
            stages.map((stageDef) => {
              const stageCandidates = filteredCandidates.filter(
                (c) => (c.currentStage || 'SELECTION_CONFIRMATION') === stageDef.stage
              );
              
              const isOver = activeDropStage === stageDef.stage;

              return (
                <div
                  key={stageDef.id}
                  className={`${styles.column} ${isOver ? styles.columnActive : ''}`}
                  onDragOver={(e) => handleDragOver(e, stageDef.stage)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stageDef.stage)}
                >
                  <div className={`${styles.columnHeader} ${styles[`stage-${stageDef.stage}`]}`}>
                    <div className={styles.columnHeaderTitle} title={stageDef.name}>
                      {stageDef.name}
                    </div>
                    <span className={styles.columnCount}>{stageCandidates.length}</span>
                  </div>

                  <div className={styles.cardsContainer}>
                    {stageCandidates.length > 0 ? (
                      stageCandidates.map((cand) => {
                        const isUpdating = updatingCandidateId === cand.id;

                        return (
                          <div
                            key={cand.id}
                            draggable={isCoordinatorOrAdmin && !isUpdating}
                            onDragStart={(e) => handleDragStart(e, cand.id)}
                            className={`${styles.card} ${cand.isAtRisk ? styles.cardRisk : ''} ${
                              draggedId === cand.id ? styles.cardDragging : ''
                            }`}
                            onDoubleClick={() => router.push(`/candidates/${cand.id}`)}
                            title="Double-click to view profile details"
                          >
                            {isUpdating && (
                              <div className={styles.loadingOverlay}>
                                <div className={styles.spinner} />
                                Updating...
                              </div>
                            )}

                            <div className={styles.cardHeader}>
                              <div className={styles.avatar}>
                                {cand.name.charAt(0)}
                              </div>
                              <div className={styles.nameInfo}>
                                <span className={styles.candName}>{cand.name}</span>
                                <span className={styles.candId}>{cand.referenceId}</span>
                              </div>
                            </div>

                            <div className={styles.cardBody}>
                              <Badge variant={getRoleBadgeVariant(cand.selectedRole)} className={styles.roleBadge}>
                                {cand.selectedRole.toLowerCase()}
                              </Badge>

                              <div className={styles.cardMeta}>
                                <span className={styles.daysLabel}>
                                  <Clock size={11} />
                                  {cand.daysInStage === 1 ? '1 day' : `${cand.daysInStage} days`}
                                </span>
                                {cand.isAtRisk && (
                                  <span className={styles.riskBadge}>
                                    <AlertTriangle size={10} />
                                    At Risk
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                              <Link href={`/candidates/${cand.id}`} onClick={(e) => e.stopPropagation()}>
                                <button
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-primary-400)',
                                    fontSize: '0.6875rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    cursor: 'pointer',
                                    padding: '2px 4px',
                                    borderRadius: '4px',
                                  }}
                                  onMouseOver={(e) => (e.currentTarget.style.color = 'var(--color-primary-300)')}
                                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--color-primary-400)')}
                                >
                                  View Profile
                                  <ExternalLink size={10} />
                                </button>
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className={styles.emptyColumn}>
                        <p>No candidates in this stage.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyColumn}>
              No milestone definitions seeded in the system.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
