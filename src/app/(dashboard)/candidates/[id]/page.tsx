// src/app/(dashboard)/candidates/[id]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Button } from '@/components/ui/Button/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card/Card';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Badge } from '@/components/ui/Badge/Badge';
import { Modal } from '@/components/ui/Modal/Modal';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table/Table';
import { cn, formatDate } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Briefcase,
  GraduationCap,
  Clock,
  User,
  Mail,
  AlertCircle,
  Award,
} from 'lucide-react';
import styles from './CandidateProfile.module.css';

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

interface Milestone {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'FLAGGED' | 'NOT_APPLICABLE' | 'OVERDUE';
  notes: string | null;
  completedAt: string | null;
  milestone: {
    id: string;
    stage: string;
    name: string;
    description: string | null;
    displayOrder: number;
    isRequired: boolean;
  };
}

interface ChecklistItem {
  id: string;
  type: 'MARKSHEET_10TH' | 'MARKSHEET_12TH' | 'DEGREE_CERTIFICATE' | 'PROVISIONAL_CERTIFICATE' | 'PASSPORT_PHOTO' | 'OFFER_LETTER_ACKNOWLEDGMENT' | 'MEDICAL_CERTIFICATE' | 'OTHER';
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'VERIFIED_BY_TCS';
  notes: string | null;
}

interface Candidate {
  id: string;
  referenceId: string;
  name: string;
  qualification: string;
  specialization: string;
  selectedRole: 'PRIME' | 'DIGITAL' | 'NINJA' | 'OTHER';
  claimStatus: 'UNCLAIMED' | 'CLAIMED' | 'DISPUTED';
  currentStage: string;
  overallStatus: 'ACTIVE' | 'DEFERRED' | 'WITHDRAWN' | 'JOINED' | 'NO_SHOW';
  joiningDate: string | null;
  remarks: string | null;
  user?: { email: string } | null;
  ipaStatus: 'NOT_ATTEMPTED' | 'FAILED' | 'CLEARED';
  ipaAttempts: number;
  ipaScore: number | null;
  milestones: Milestone[];
  checklistItems: ChecklistItem[];
  auditLogs?: AuditLog[];
}

export default function CandidateProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const id = params.id;

  const userRole = session?.user?.role || 'CANDIDATE';
  const isCoordinatorOrAdmin = userRole === 'ADMIN' || userRole === 'COORDINATOR';
  const isAdmin = userRole === 'ADMIN';

  // State
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editQual, setEditQual] = useState('');
  const [editSpec, setEditSpec] = useState('');
  const [editRole, setEditRole] = useState('NINJA');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editJoiningDate, setEditJoiningDate] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editIpaStatus, setEditIpaStatus] = useState<'NOT_ATTEMPTED' | 'FAILED' | 'CLEARED'>('NOT_ATTEMPTED');
  const [editIpaAttempts, setEditIpaAttempts] = useState('0');
  const [editIpaScore, setEditIpaScore] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Update Milestone Modal State
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [milestoneStatus, setMilestoneStatus] = useState('PENDING');
  const [milestoneNotes, setMilestoneNotes] = useState('');
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);
  const [milestoneError, setMilestoneError] = useState<string | null>(null);

  // Fetch Candidate Profile
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/candidates/${id}`);
      const data = await res.json();

      if (data.success) {
        setCandidate(data.data);
        
        // Populate edit form states
        setEditName(data.data.name);
        setEditQual(data.data.qualification);
        setEditSpec(data.data.specialization);
        setEditRole(data.data.selectedRole);
        setEditStatus(data.data.overallStatus);
        setEditRemarks(data.data.remarks || '');
        setEditIpaStatus(data.data.ipaStatus || 'NOT_ATTEMPTED');
        setEditIpaAttempts(String(data.data.ipaAttempts || 0));
        setEditIpaScore(data.data.ipaScore !== null && data.data.ipaScore !== undefined ? String(data.data.ipaScore) : '');
        if (data.data.joiningDate) {
          setEditJoiningDate(data.data.joiningDate.split('T')[0]);
        } else {
          setEditJoiningDate('');
        }
      } else {
        setError(data.error || 'Failed to load candidate profile');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching candidate profile.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle Profile Update (PUT)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setIsSavingProfile(true);

    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          qualification: editQual,
          specialization: editSpec,
          selectedRole: editRole,
          overallStatus: editStatus,
          remarks: editRemarks,
          joiningDate: editJoiningDate ? new Date(editJoiningDate).toISOString() : null,
          ipaStatus: editIpaStatus,
          ipaAttempts: parseInt(editIpaAttempts, 10) || 0,
          ipaScore: editIpaScore !== '' ? parseFloat(editIpaScore) : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsEditModalOpen(false);
        fetchProfile();
        toast.success('Candidate profile updated successfully.');
      } else {
        setEditError(data.error || 'Update failed');
      }
    } catch (err) {
      console.error(err);
      setEditError('Connection failed.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Milestone Update (PUT)
  const handleUpdateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone) return;

    setMilestoneError(null);
    setIsSavingMilestone(true);

    try {
      const res = await fetch(`/api/milestones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId: selectedMilestone.milestone.id,
          status: milestoneStatus,
          notes: milestoneNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsMilestoneModalOpen(false);
        setSelectedMilestone(null);
        setMilestoneNotes('');
        fetchProfile();
        toast.success('Candidate milestone updated successfully.');
      } else {
        setMilestoneError(data.error || 'Update milestone failed');
      }
    } catch (err) {
      console.error(err);
      setMilestoneError('Connection failed.');
    } finally {
      setIsSavingMilestone(false);
    }
  };

  // Handle Checklist Toggles (PUT)
  const handleChecklistUpdate = async (type: string, status: string) => {
    try {
      const res = await fetch(`/api/checklist/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProfile();
        toast.success('Checklist updated successfully.');
      } else {
        toast.error(data.error || 'Update checklist failed.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update checklist item.');
    }
  };

  // Handle Candidate Soft-Delete (Mark Withdrawn)
  const handleDeleteCandidate = async () => {
    if (!window.confirm('Are you sure you want to mark this candidate as WITHDRAWN? This will soft-delete their profile.')) {
      return;
    }

    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Candidate withdrawn successfully.');
        router.push('/candidates');
      } else {
        toast.error(data.error || 'Failed to soft-delete candidate.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection failed.');
    }
  };

  // Open Edit Milestone Dialog
  const openMilestoneModal = (ms: Milestone) => {
    setSelectedMilestone(ms);
    setMilestoneStatus(ms.status);
    setMilestoneNotes(ms.notes || '');
    setIsMilestoneModalOpen(true);
  };

  // Status style maps
  const getClaimStatusBadge = (status: string) => {
    switch (status) {
      case 'CLAIMED': return <Badge variant="success">Claimed</Badge>;
      case 'DISPUTED': return <Badge variant="error" glow>Disputed</Badge>;
      default: return <Badge variant="neutral">Unclaimed</Badge>;
    }
  };

  const getOverallStatusBadge = (status: string) => {
    switch (status) {
      case 'JOINED': return <Badge variant="success">Joined</Badge>;
      case 'DEFERRED': return <Badge variant="warning">Deferred</Badge>;
      case 'WITHDRAWN': return <Badge variant="error">Withdrawn</Badge>;
      case 'NO_SHOW': return <Badge variant="error" glow>No Show</Badge>;
      default: return <Badge variant="info">Active</Badge>;
    }
  };

  const getIpaBadge = (status: string) => {
    switch (status) {
      case 'CLEARED':
        return <Badge variant="success" glow>Cleared</Badge>;
      case 'FAILED':
        return <Badge variant="error">Failed</Badge>;
      default:
        return <Badge variant="neutral">Not Attempted</Badge>;
    }
  };

  const getMilestoneStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'VERIFIED': return <Badge variant="success" glow>Verified</Badge>;
      case 'IN_PROGRESS': return <Badge variant="pending">In Progress</Badge>;
      case 'FLAGGED': return <Badge variant="error" glow>Flagged</Badge>;
      case 'NOT_APPLICABLE': return <Badge variant="neutral">N/A</Badge>;
      case 'OVERDUE': return <Badge variant="error">Overdue</Badge>;
      default: return <Badge variant="neutral">Pending</Badge>;
    }
  };

  const getChecklistItemBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED_BY_TCS': return <Badge variant="success" glow>Verified</Badge>;
      case 'SUBMITTED': return <Badge variant="info">Submitted</Badge>;
      default: return <Badge variant="neutral">Not Submitted</Badge>;
    }
  };

  // Skeleton Loader rendering
  if (isLoading && !candidate) {
    return (
      <div className={styles.loadingContainer}>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading candidate profile details...</p>
        </div>
      </div>
    );
  }

  // Error view
  if (error || !candidate) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={40} style={{ color: 'var(--color-error)', marginBottom: '16px' }} />
        <h2>Profile Error</h2>
        <p style={{ margin: '10px 0 20px', color: 'var(--color-text-secondary)' }}>{error || 'Profile could not be loaded.'}</p>
        <Link href="/candidates">
          <Button variant="outline">
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Back to Registry
          </Button>
        </Link>
      </div>
    );
  }

  // Count checklist completion percentage
  const verifiedCount = candidate.checklistItems.filter(item => item.status === 'VERIFIED_BY_TCS').length;
  const submittedCount = candidate.checklistItems.filter(item => item.status === 'SUBMITTED').length + verifiedCount;
  const checklistProgressPercent = Math.round((submittedCount / candidate.checklistItems.length) * 100);

  return (
    <div className={styles.container}>
      <PageHeader
        title={candidate.name}
        description={`Onboarding profile and milestones tracking for ID ${candidate.referenceId}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/overview' },
          { label: 'Candidates', href: '/candidates' },
          { label: candidate.name },
        ]}
        actions={
          <div className={styles.headerActions}>
            <Link href="/candidates">
              <Button variant="outline" size="sm">
                <ArrowLeft size={16} style={{ marginRight: '8px' }} />
                Registry
              </Button>
            </Link>
            {isCoordinatorOrAdmin && (
              <Button size="sm" variant="secondary" onClick={() => setIsEditModalOpen(true)}>
                <Edit size={16} style={{ marginRight: '8px' }} />
                Edit Profile
              </Button>
            )}
            {isAdmin && (
              <Button size="sm" variant="danger" onClick={handleDeleteCandidate}>
                <Trash2 size={16} style={{ marginRight: '8px' }} />
                Withdraw
              </Button>
            )}
          </div>
        }
      />

      <div className={styles.profileGrid}>
        {/* LEFT PANEL: PROFILE CARD */}
        <div className={styles.leftPanel}>
          <Card className={styles.detailsCard}>
            <CardHeader className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Candidate Overview</h3>
              {getOverallStatusBadge(candidate.overallStatus)}
            </CardHeader>
            <CardContent className={styles.detailsList}>
              <div className={styles.avatarRow}>
                <div className={styles.bigAvatar}>
                  <User size={36} />
                </div>
                <div className={styles.avatarMeta}>
                  <span className={styles.candidateName}>{candidate.name}</span>
                  <span className={styles.candidateRefId}>{candidate.referenceId}</span>
                </div>
              </div>

              <div className={styles.detailItem}>
                <Briefcase size={16} className={styles.detailIcon} />
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>Approved Offer Role</span>
                  <span className={styles.detailValueRole}>{candidate.selectedRole}</span>
                </div>
              </div>

              <div className={styles.detailItem}>
                <GraduationCap size={16} className={styles.detailIcon} />
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>Qualification</span>
                  <span className={styles.detailValue}>
                    {candidate.qualification} - {candidate.specialization}
                  </span>
                </div>
              </div>

              <div className={styles.detailItem}>
                <Clock size={16} className={styles.detailIcon} />
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>Registration Account</span>
                  <span className={styles.detailValue}>
                    {getClaimStatusBadge(candidate.claimStatus)}
                  </span>
                </div>
              </div>

              {candidate.user && (
                <div className={styles.detailItem}>
                  <Mail size={16} className={styles.detailIcon} />
                  <div className={styles.detailContent}>
                    <span className={styles.detailLabel}>Email Address</span>
                    <span className={styles.detailValueEmail}>{candidate.user.email}</span>
                  </div>
                </div>
              )}

              <div className={styles.detailItem}>
                <Calendar size={16} className={styles.detailIcon} />
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>Confirmed Joining Date</span>
                  <span className={styles.detailValueDate}>
                    {formatDate(candidate.joiningDate)}
                  </span>
                </div>
              </div>

              <div className={styles.detailItem}>
                <Award size={16} className={styles.detailIcon} />
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>IPA Status & Score</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    {getIpaBadge(candidate.ipaStatus)}
                    <span className={styles.detailValue} style={{ fontSize: '0.8125rem' }}>
                      {candidate.ipaAttempts} attempt{candidate.ipaAttempts !== 1 ? 's' : ''}
                      {candidate.ipaScore !== null ? ` (${candidate.ipaScore}%)` : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.remarksBlock}>
                <span className={styles.detailLabel}>Coordinators Remarks</span>
                <p className={styles.remarksText}>
                  {candidate.remarks || 'No notes added yet.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CHECKLIST CARD */}
          <Card className={styles.checklistCard}>
            <CardHeader className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Documents Checklist</h3>
              <span className={styles.progressLabel}>{checklistProgressPercent}% Submitted</span>
            </CardHeader>
            <CardContent className={styles.checklistContent}>
              <p className={styles.checklistInfo}>
                Verify candidate uploads statuses from TCS NextStep. No actual files are stored.
              </p>
              
              <div className={styles.checklistGrid}>
                {candidate.checklistItems.map((item) => {
                  const docLabel = item.type
                    .replace(/_/g, ' ')
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase());

                  return (
                    <div key={item.id} className={styles.checklistItem}>
                      <div className={styles.checklistMeta}>
                        <span className={styles.docName}>{docLabel}</span>
                        {getChecklistItemBadge(item.status)}
                      </div>
                      
                      {/* Controls for checklists (Admin/Coordinator or Candidate self-update) */}
                      <div className={styles.checklistActions}>
                        <button
                          className={styles.checklistToggleBtn}
                          disabled={item.status === 'NOT_SUBMITTED'}
                          onClick={() => handleChecklistUpdate(item.type, 'NOT_SUBMITTED')}
                        >
                          Unsubmit
                        </button>
                        <button
                          className={styles.checklistToggleBtn}
                          disabled={item.status === 'SUBMITTED'}
                          onClick={() => handleChecklistUpdate(item.type, 'SUBMITTED')}
                        >
                          Submit
                        </button>
                        {isCoordinatorOrAdmin && (
                          <button
                            className={styles.checklistVerifyBtn}
                            disabled={item.status === 'VERIFIED_BY_TCS'}
                            onClick={() => handleChecklistUpdate(item.type, 'VERIFIED_BY_TCS')}
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL: MILESTONES & AUDIT HISTORY */}
        <div className={styles.rightPanel}>
          {/* MILESTONE TIMELINE */}
          <Card className={styles.timelineCard}>
            <CardHeader className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Milestone Timeline Progress</h3>
            </CardHeader>
            <CardContent>
              <div className={styles.timelineStepper}>
                {candidate.milestones.map((ms) => {
                  const isCurrent = candidate.currentStage === ms.milestone.stage;
                  const isFinished = ['COMPLETED', 'VERIFIED', 'NOT_APPLICABLE'].includes(ms.status);
                  
                  let dotClass = styles.dotPending;
                  if (isFinished) dotClass = styles.dotCompleted;
                  else if (ms.status === 'FLAGGED') dotClass = styles.dotFlagged;
                  else if (ms.status === 'IN_PROGRESS' || isCurrent) dotClass = styles.dotCurrent;

                  return (
                    <div
                      key={ms.id}
                      className={cn(
                        styles.timelineStep,
                        isCurrent && styles.stepActive,
                        isFinished && styles.stepCompleted
                      )}
                    >
                      <div className={styles.timelineIndicator}>
                        <div className={cn(styles.indicatorDot, dotClass, isCurrent && styles.pulsingDot)} />
                        <div className={styles.indicatorLine} />
                      </div>

                      <div className={styles.stepBody}>
                        <div className={styles.stepHeader}>
                          <h4 className={styles.stepTitle}>
                            {ms.milestone.name}
                            {ms.milestone.isRequired && <span className={styles.requiredStar}>*</span>}
                          </h4>
                          <div className={styles.stepActions}>
                            {getMilestoneStatusBadge(ms.status)}
                            {isCoordinatorOrAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className={styles.msUpdateBtn}
                                onClick={() => openMilestoneModal(ms)}
                              >
                                Update
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className={styles.stepDesc}>{ms.milestone.description}</p>
                        {ms.notes && (
                          <div className={styles.stepNotes}>
                            <strong>Notes:</strong> {ms.notes}
                          </div>
                        )}
                        {ms.completedAt && (
                          <div className={styles.stepDate}>
                            Cleared on {formatDate(ms.completedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AUDIT LOG HISTORY */}
          {isCoordinatorOrAdmin && candidate.auditLogs && (
            <Card className={styles.auditCard}>
              <CardHeader className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Security Audit logs</h3>
              </CardHeader>
              <CardContent className={styles.auditContent}>
                <div style={{ overflowX: 'auto' }}>
                  <Table style={{ fontSize: '0.8rem' }}>
                    <THead>
                      <TR>
                        <TH style={{ padding: '8px' }}>Action</TH>
                        <TH style={{ padding: '8px' }}>Triggered By</TH>
                        <TH style={{ padding: '8px' }}>Details</TH>
                        <TH style={{ padding: '8px' }}>Timestamp</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {candidate.auditLogs.length > 0 ? (
                        candidate.auditLogs.map((log) => (
                          <TR key={log.id}>
                            <TD style={{ padding: '8px', fontWeight: 600 }}>{log.action.replace(/_/g, ' ')}</TD>
                            <TD style={{ padding: '8px' }}>
                              {log.user.name} ({log.user.role.toLowerCase()})
                            </TD>
                            <TD style={{ padding: '8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {log.details || '-'}
                            </TD>
                            <TD style={{ padding: '8px' }}>{formatDate(log.createdAt)}</TD>
                          </TR>
                        ))
                      ) : (
                        <TR>
                          <TD colSpan={4} style={{ textAlign: 'center', padding: '12px' }}>
                            No operations logged yet.
                          </TD>
                        </TR>
                      )}
                    </TBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Candidate Profile details"
        size="md"
      >
        {editError && (
          <div className={styles.modalError} role="alert">
            <AlertCircle size={16} style={{ marginRight: '8px' }} />
            {editError}
          </div>
        )}
        <form onSubmit={handleUpdateProfile} className={styles.modalForm}>
          <Input
            label="Full Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            disabled={isSavingProfile}
          />
          <div className={styles.formGrid}>
            <Input
              label="Qualification"
              value={editQual}
              onChange={(e) => setEditQual(e.target.value)}
              disabled={isSavingProfile}
            />
            <Input
              label="Specialization"
              value={editSpec}
              onChange={(e) => setEditSpec(e.target.value)}
              disabled={isSavingProfile}
            />
          </div>
          <div className={styles.formGrid}>
            <Select
              label="Approved Offer Role"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              disabled={isSavingProfile}
              options={[
                { value: 'NINJA', label: 'Ninja' },
                { value: 'DIGITAL', label: 'Digital' },
                { value: 'PRIME', label: 'Prime' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
            <Select
              label="Overall Status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              disabled={isSavingProfile}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'DEFERRED', label: 'Deferred' },
                { value: 'WITHDRAWN', label: 'Withdrawn' },
                { value: 'JOINED', label: 'Joined' },
                { value: 'NO_SHOW', label: 'No Show' },
              ]}
            />
          </div>
          <Input
            label="Confirmed Joining Date"
            type="date"
            value={editJoiningDate}
            onChange={(e) => setEditJoiningDate(e.target.value)}
            disabled={isSavingProfile}
          />
          <div className={styles.formGrid}>
            <Select
              label="IPA Status"
              value={editIpaStatus}
              onChange={(e) => setEditIpaStatus(e.target.value as 'NOT_ATTEMPTED' | 'FAILED' | 'CLEARED')}
              disabled={isSavingProfile}
              options={[
                { value: 'NOT_ATTEMPTED', label: 'Not Attempted' },
                { value: 'FAILED', label: 'Failed' },
                { value: 'CLEARED', label: 'Cleared' },
              ]}
            />
            <div className={styles.formGrid}>
              <Input
                label="IPA Attempts"
                type="number"
                min="0"
                value={editIpaAttempts}
                onChange={(e) => setEditIpaAttempts(e.target.value)}
                disabled={isSavingProfile}
              />
              <Input
                label="IPA Score (%)"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={editIpaScore}
                onChange={(e) => setEditIpaScore(e.target.value)}
                disabled={isSavingProfile}
                placeholder="e.g. 80.5"
              />
            </div>
          </div>
          <div className={styles.textareaWrapper}>
            <label className={styles.textareaLabel}>Remarks / internal notes</label>
            <textarea
              className={styles.textarea}
              value={editRemarks}
              onChange={(e) => setEditRemarks(e.target.value)}
              rows={3}
              disabled={isSavingProfile}
            />
          </div>
          <div className={styles.modalActions}>
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSavingProfile}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSavingProfile}>
              Save Updates
            </Button>
          </div>
        </form>
      </Modal>

      {/* UPDATE MILESTONE MODAL */}
      <Modal
        isOpen={isMilestoneModalOpen}
        onClose={() => {
          setIsMilestoneModalOpen(false);
          setSelectedMilestone(null);
        }}
        title={`Update Status: ${selectedMilestone?.milestone.name || ''}`}
        size="sm"
      >
        {milestoneError && (
          <div className={styles.modalError} role="alert">
            <AlertCircle size={16} style={{ marginRight: '8px' }} />
            {milestoneError}
          </div>
        )}
        <form onSubmit={handleUpdateMilestone} className={styles.modalForm}>
          <Select
            label="Milestone State Status"
            value={milestoneStatus}
            onChange={(e) => setMilestoneStatus(e.target.value)}
            disabled={isSavingMilestone}
            options={[
              { value: 'PENDING', label: 'Pending' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'VERIFIED', label: 'Verified' },
              { value: 'FLAGGED', label: 'Flagged' },
              { value: 'NOT_APPLICABLE', label: 'Not Applicable (N/A)' },
              { value: 'OVERDUE', label: 'Overdue' },
            ]}
          />
          <div className={styles.textareaWrapper}>
            <label className={styles.textareaLabel}>Milestone Notes / Audit reasons</label>
            <textarea
              className={styles.textarea}
              placeholder="e.g. Cleared via portal check, scheduling info..."
              value={milestoneNotes}
              onChange={(e) => setMilestoneNotes(e.target.value)}
              rows={3}
              disabled={isSavingMilestone}
            />
          </div>
          <div className={styles.modalActions}>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsMilestoneModalOpen(false);
                setSelectedMilestone(null);
              }}
              disabled={isSavingMilestone}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSavingMilestone}>
              Save Updates
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
