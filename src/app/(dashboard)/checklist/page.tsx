// src/app/(dashboard)/checklist/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Badge } from '@/components/ui/Badge/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar/ProgressBar';
import { useToast } from '@/context/ToastContext';
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton/Skeleton';
import {
  TableContainer,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from '@/components/ui/Table/Table';
import {
  Search,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  FileCheck,
  Save,
} from 'lucide-react';
import styles from './Checklist.module.css';

interface DocumentChecklistItem {
  id: string;
  candidateId: string;
  type: 'MARKSHEET_10TH' | 'MARKSHEET_12TH' | 'DEGREE_CERTIFICATE' | 'PROVISIONAL_CERTIFICATE' | 'PASSPORT_PHOTO' | 'OFFER_LETTER_ACKNOWLEDGMENT' | 'MEDICAL_CERTIFICATE' | 'OTHER';
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'VERIFIED_BY_TCS';
  notes: string | null;
  updatedAt: string;
}

interface Candidate {
  id: string;
  referenceId: string;
  name: string;
  qualification: string;
  specialization: string;
  selectedRole: string;
  claimStatus: string;
  overallStatus: string;
  checklistItems?: DocumentChecklistItem[];
}

const DOCUMENT_LABELS: Record<string, string> = {
  MARKSHEET_10TH: '10th Marksheet',
  MARKSHEET_12TH: '12th Marksheet',
  DEGREE_CERTIFICATE: 'Degree Certificate',
  PROVISIONAL_CERTIFICATE: 'Provisional Certificate',
  PASSPORT_PHOTO: 'Passport Size Photo',
  OFFER_LETTER_ACKNOWLEDGMENT: 'Offer Letter Acknowledgment',
  MEDICAL_CERTIFICATE: 'Medical Certificate',
  OTHER: 'Other Supporting Documents',
};



export default function ChecklistPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || 'CANDIDATE';
  const { toast } = useToast();

  // --- CANDIDATE STATES ---
  const [candidateData, setCandidateData] = useState<Candidate | null>(null);
  const [candidateChecklist, setCandidateChecklist] = useState<DocumentChecklistItem[]>([]);
  const [isCandidateLoading, setIsCandidateLoading] = useState(true);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // --- COORDINATOR / ADMIN STATES ---
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isListLoading, setIsListLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Expandable Candidate checklist states
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);
  const [expandedChecklist, setExpandedChecklist] = useState<DocumentChecklistItem[]>([]);
  const [isChecklistLoading, setIsChecklistLoading] = useState(false);
  const [savingDocType, setSavingDocType] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  // ----------------------------------------------------
  // FETCH CANDIDATE DATA (SELF VIEW)
  // ----------------------------------------------------
  const fetchCandidateSelfData = useCallback(async () => {
    if (!session?.user?.candidateId) {
      setCandidateError('No candidate profile associated with this account. Please claim a candidate ID.');
      setIsCandidateLoading(false);
      return;
    }

    setIsCandidateLoading(true);
    setCandidateError(null);
    try {
      const res = await fetch(`/api/candidates/${session.user.candidateId}`);
      const json = await res.json();
      if (json.success) {
        setCandidateData(json.data);
        setCandidateChecklist(json.data.checklistItems || []);
      } else {
        setCandidateError(json.error || 'Failed to load checklist details.');
      }
    } catch (err) {
      console.error(err);
      setCandidateError('Error fetching document checklist.');
    } finally {
      setIsCandidateLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (role === 'CANDIDATE') {
      fetchCandidateSelfData();
    }
  }, [role, fetchCandidateSelfData]);

  // ----------------------------------------------------
  // FETCH CANDIDATES LIST (COORDINATOR/ADMIN VIEW)
  // ----------------------------------------------------
  const fetchCandidatesList = useCallback(async () => {
    setIsListLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy: 'name',
        sortOrder: 'asc',
      });
      if (debouncedSearch) {
        queryParams.append('search', debouncedSearch);
      }

      const res = await fetch(`/api/candidates?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCandidates(json.data);
        setTotalCount(json.meta.total);
        setTotalPages(json.meta.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
    } finally {
      setIsListLoading(false);
    }
  }, [page, pageSize, debouncedSearch]);

  useEffect(() => {
    if (role === 'ADMIN' || role === 'COORDINATOR') {
      fetchCandidatesList();
    }
  }, [role, fetchCandidatesList]);

  // ----------------------------------------------------
  // FETCH SINGLE CANDIDATE CHECKLIST FOR EXPANSION
  // ----------------------------------------------------
  const handleExpandCandidate = async (candidateId: string) => {
    if (expandedCandidateId === candidateId) {
      setExpandedCandidateId(null);
      setExpandedChecklist([]);
      setEditingNotes({});
      return;
    }

    setExpandedCandidateId(candidateId);
    setIsChecklistLoading(true);
    setExpandedChecklist([]);
    setEditingNotes({});

    try {
      const res = await fetch(`/api/candidates/${candidateId}`);
      const json = await res.json();
      if (json.success) {
        const items = json.data.checklistItems || [];
        setExpandedChecklist(items);
        
        // Initialize editing notes with existing db notes
        const notesMap: Record<string, string> = {};
        items.forEach((item: DocumentChecklistItem) => {
          notesMap[item.type] = item.notes || '';
        });
        setEditingNotes(notesMap);
      }
    } catch (err) {
      console.error('Error fetching candidate checklist:', err);
    } finally {
      setIsChecklistLoading(false);
    }
  };

  // ----------------------------------------------------
  // ACTIONS: CANDIDATE TOGGLE SUBMISSION
  // ----------------------------------------------------
  const handleToggleCandidateDoc = async (item: DocumentChecklistItem) => {
    if (item.status === 'VERIFIED_BY_TCS') return;

    const newStatus = item.status === 'SUBMITTED' ? 'NOT_SUBMITTED' : 'SUBMITTED';
    setTogglingId(item.id);

    try {
      const res = await fetch(`/api/checklist/${item.candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: item.type,
          status: newStatus,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setCandidateChecklist((prev) =>
          prev.map((c) => (c.id === item.id ? { ...c, status: newStatus } : c))
        );
        toast.success(`Successfully marked "${DOCUMENT_LABELS[item.type]}" as ${newStatus === 'SUBMITTED' ? 'submitted' : 'unsubmitted'}.`);
      } else {
        toast.error(json.error || 'Failed to update status.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating status. Please try again.');
    } finally {
      setTogglingId(null);
    }
  };

  // ----------------------------------------------------
  // ACTIONS: COORDINATOR UPDATE STATUS & NOTES
  // ----------------------------------------------------
  const handleCoordinatorSaveDoc = async (
    candidateId: string,
    type: string,
    status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'VERIFIED_BY_TCS',
    notes: string
  ) => {
    setSavingDocType(type);

    try {
      const res = await fetch(`/api/checklist/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          status,
          notes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        // Update local state for expanded checklist
        setExpandedChecklist((prev) =>
          prev.map((c) =>
            c.type === type ? { ...c, status, notes: notes || null } : c
          )
        );
        toast.success(`Successfully updated status for "${DOCUMENT_LABELS[type]}".`);
      } else {
        toast.error(json.error || 'Failed to save checklist item.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving checklist changes.');
    } finally {
      setSavingDocType(null);
    }
  };

  // ----------------------------------------------------
  // HELPERS
  // ----------------------------------------------------
  const getProgressStats = (items: DocumentChecklistItem[]) => {
    if (items.length === 0) return { percentage: 0, completed: 0 };
    const completed = items.filter(
      (item) => item.status === 'SUBMITTED' || item.status === 'VERIFIED_BY_TCS'
    ).length;
    const percentage = Math.round((completed / items.length) * 100);
    return { percentage, completed };
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'VERIFIED_BY_TCS':
        return 'success';
      case 'SUBMITTED':
        return 'info';
      default:
        return 'warning';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'VERIFIED_BY_TCS':
        return 'Verified by TCS';
      case 'SUBMITTED':
        return 'Submitted';
      default:
        return 'Pending';
    }
  };

  // ----------------------------------------------------
  // RENDER: CANDIDATE VIEW
  // ----------------------------------------------------
  const renderCandidateView = () => {
    if (isCandidateLoading) {
      return (
        <div className={styles.candidateContainer}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      );
    }

    if (candidateError) {
      return (
        <Card className={styles.errorCard}>
          <CardContent className={styles.errorContent}>
            <AlertCircle size={36} className={styles.errorIcon} />
            <h3>Access Issue</h3>
            <p>{candidateError}</p>
          </CardContent>
        </Card>
      );
    }

    const { percentage, completed } = getProgressStats(candidateChecklist);

    return (
      <div className={styles.candidateContainer}>
        {/* Progress summary banner */}
        <Card className={styles.progressCard}>
          <CardContent className={styles.progressGrid}>
            <div className={styles.progressIntro}>
              <h2>Welcome, {candidateData?.name}</h2>
              <p>
                Complete your onboarding profile by uploading or indicating the submission
                status of your documents. TCS Onboarding team will verify them below.
              </p>
              <div className={styles.progressStatsSummary}>
                <span className={styles.progressMetric}>
                  <strong>{completed}</strong> / {candidateChecklist.length} Submitted
                </span>
                <span className={styles.progressPercent}>{percentage}% Completed</span>
              </div>
              <ProgressBar
                value={percentage}
                variant={percentage === 100 ? 'success' : 'primary'}
                size="lg"
                showValue={false}
                className={styles.pBar}
              />
            </div>
            <div className={styles.progressVisual}>
              <div className={styles.visualRing}>
                <span>{percentage}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List of documents */}
        <Card className={styles.documentsCard}>
          <CardHeader className={styles.cardHeaderFlex}>
            <div className={styles.cardHeaderMeta}>
              <h3>Onboarding Checklist</h3>
              <p>Verify all required documents. Redo any pending items.</p>
            </div>
            <Badge variant={percentage === 100 ? 'success' : 'warning'} glow>
              {percentage === 100 ? 'Complete' : 'Pending Verification'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className={styles.documentList}>
              {candidateChecklist.length > 0 ? (
                candidateChecklist.map((item) => {
                  const isVerified = item.status === 'VERIFIED_BY_TCS';
                  const isSubmitted = item.status === 'SUBMITTED';
                  const isToggling = togglingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`${styles.documentRow} ${
                        isVerified ? styles.verifiedRow : ''
                      }`}
                    >
                      <div className={styles.rowIcon}>
                        {isVerified ? (
                          <FileCheck size={20} className={styles.iconSuccess} />
                        ) : (
                          <FileText size={20} className={styles.iconPending} />
                        )}
                      </div>
                      <div className={styles.rowMeta}>
                        <h4 className={styles.docName}>{DOCUMENT_LABELS[item.type]}</h4>
                        {item.notes && (
                          <p className={styles.coordNotes}>
                            <strong>TCS Coordinator Note:</strong> {item.notes}
                          </p>
                        )}
                      </div>
                      <div className={styles.rowStatus}>
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {getStatusText(item.status)}
                        </Badge>
                      </div>
                      <div className={styles.rowAction}>
                        {isVerified ? (
                          <span className={styles.verifiedText}>
                            <Check size={16} /> Verified
                          </span>
                        ) : (
                          <Button
                            variant={isSubmitted ? 'outline' : 'primary'}
                            size="sm"
                            isLoading={isToggling}
                            onClick={() => handleToggleCandidateDoc(item)}
                          >
                            {isSubmitted ? 'Mark Unsubmitted' : 'Mark Submitted'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className={styles.emptyText}>No checklist documents found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ----------------------------------------------------
  // RENDER: COORDINATOR / ADMIN VIEW
  // ----------------------------------------------------
  const renderCoordinatorView = () => {
    return (
      <div className={styles.coordinatorContainer}>
        {/* Filter Toolbar */}
        <Card className={styles.filterCard}>
          <CardContent className={styles.filterBar}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={18} />
              <Input
                type="text"
                placeholder="Search candidate by name or Reference ID (CT/DT)..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className={styles.searchInput}
              />
            </div>
          </CardContent>
        </Card>

        {/* Candidate List Card */}
        <Card className={styles.listCard}>
          <CardHeader>
            <div className={styles.listTitleMeta}>
              <h3>Select Candidate to Verify Checklist</h3>
              <p>Total Claimed & Unclaimed Candidates: {totalCount}</p>
            </div>
          </CardHeader>
          <CardContent>
            {isListLoading ? (
              <SkeletonTable rows={10} cols={6} />
            ) : (
              <TableContainer>
                <Table>
                  <THead>
                    <TR>
                      <TH>Reference ID</TH>
                      <TH>Name</TH>
                      <TH>Role</TH>
                      <TH>Claim Status</TH>
                      <TH>Overall Status</TH>
                      <TH align="right">Action</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {candidates.length > 0 ? (
                      candidates.map((cand) => {
                        const isExpanded = expandedCandidateId === cand.id;
                        return (
                          <React.Fragment key={cand.id}>
                            <TR
                              className={`${styles.candidateRow} ${
                                isExpanded ? styles.activeRow : ''
                              }`}
                              onClick={() => handleExpandCandidate(cand.id)}
                            >
                              <TD>
                                <strong>{cand.referenceId}</strong>
                              </TD>
                              <TD>{cand.name}</TD>
                              <TD>
                                <Badge variant="neutral">{cand.selectedRole}</Badge>
                              </TD>
                              <TD>
                                <Badge
                                  variant={
                                    cand.claimStatus === 'CLAIMED'
                                      ? 'success'
                                      : cand.claimStatus === 'DISPUTED'
                                      ? 'error'
                                      : 'neutral'
                                  }
                                >
                                  {cand.claimStatus}
                                </Badge>
                              </TD>
                              <TD>
                                <Badge
                                  variant={
                                    cand.overallStatus === 'ACTIVE'
                                      ? 'success'
                                      : cand.overallStatus === 'JOINED'
                                      ? 'success'
                                      : 'neutral'
                                  }
                                >
                                  {cand.overallStatus}
                                </Badge>
                              </TD>
                              <TD align="right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExpandCandidate(cand.id);
                                  }}
                                  className={styles.expandBtn}
                                >
                                  {isExpanded ? (
                                    <>
                                      Collapse <ChevronUp size={16} />
                                    </>
                                  ) : (
                                    <>
                                      Verify Checklist <ChevronDown size={16} />
                                    </>
                                  )}
                                </Button>
                              </TD>
                            </TR>

                            {isExpanded && (
                              <TR className={styles.expansionRow}>
                                <TD colSpan={6} className={styles.expansionCell}>
                                  <div className={styles.expandedPanel}>
                                    {isChecklistLoading ? (
                                      <div className={styles.checklistVerifyGrid}>
                                        <SkeletonTable rows={8} cols={4} />
                                      </div>
                                    ) : (
                                      <div className={styles.checklistVerifyGrid}>
                                        <div className={styles.panelIntro}>
                                          <h4>
                                            Verify Checklist for {cand.name} ({cand.referenceId})
                                          </h4>
                                          <p>
                                            Review and update document verification statuses.
                                            Updates trigger a real-time notification to the candidate.
                                          </p>
                                          <div className={styles.panelSummaryStats}>
                                            {(() => {
                                              const { percentage, completed } =
                                                getProgressStats(expandedChecklist);
                                              return (
                                                <>
                                                  <span>
                                                    <strong>{completed}</strong> /{' '}
                                                    {expandedChecklist.length} Verified or Submitted
                                                  </span>
                                                  <ProgressBar
                                                    value={percentage}
                                                    variant={
                                                      percentage === 100
                                                        ? 'success'
                                                        : 'primary'
                                                    }
                                                    size="sm"
                                                    className={styles.panelProgressBar}
                                                  />
                                                </>
                                              );
                                            })()}
                                          </div>
                                        </div>

                                        <div className={styles.checklistEditorList}>
                                          {expandedChecklist.map((item) => {
                                            const noteValue = editingNotes[item.type] || '';
                                            const isSaving = savingDocType === item.type;

                                            return (
                                              <div
                                                key={item.id}
                                                className={styles.editorRow}
                                              >
                                                <div className={styles.editorDocMeta}>
                                                  <span className={styles.editorDocLabel}>
                                                    {DOCUMENT_LABELS[item.type]}
                                                  </span>
                                                </div>
                                                <div className={styles.editorDocStatus}>
                                                  <Select
                                                    value={item.status}
                                                    onChange={(e) =>
                                                      handleCoordinatorSaveDoc(
                                                        cand.id,
                                                        item.type,
                                                        e.target.value as 'NOT_SUBMITTED' | 'SUBMITTED' | 'VERIFIED_BY_TCS',
                                                        noteValue
                                                      )
                                                    }
                                                    options={[
                                                      { value: 'NOT_SUBMITTED', label: 'Pending (Not Submitted)' },
                                                      { value: 'SUBMITTED', label: 'Submitted' },
                                                      { value: 'VERIFIED_BY_TCS', label: 'Verified by TCS' },
                                                    ]}
                                                    className={styles.editorSelect}
                                                  />
                                                </div>
                                                <div className={styles.editorDocNotes}>
                                                  <Input
                                                    type="text"
                                                    placeholder="Add remarks or notes..."
                                                    value={noteValue}
                                                    onChange={(e) =>
                                                      setEditingNotes((prev) => ({
                                                        ...prev,
                                                        [item.type]: e.target.value,
                                                      }))
                                                    }
                                                    className={styles.editorNotesInput}
                                                  />
                                                </div>
                                                <div className={styles.editorDocAction}>
                                                  <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    isLoading={isSaving}
                                                    onClick={() =>
                                                      handleCoordinatorSaveDoc(
                                                        cand.id,
                                                        item.type,
                                                        item.status,
                                                        noteValue
                                                      )
                                                    }
                                                    className={styles.editorSaveBtn}
                                                    title="Save notes"
                                                  >
                                                    <Save size={15} /> Save Note
                                                  </Button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </TD>
                              </TR>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <TR>
                        <TD colSpan={6} align="center" className={styles.emptyCell}>
                          No candidates found matching the query.
                        </TD>
                      </TR>
                    )}
                  </TBody>
                </Table>
              </TableContainer>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className={styles.pageIndicator}>
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="Document Checklist"
        description={
          role === 'CANDIDATE'
            ? 'Track onboarding documents status'
            : 'Manage and verify candidate onboarding documents'
        }
      />
      {role === 'CANDIDATE' ? renderCandidateView() : renderCoordinatorView()}
    </div>
  );
}
