// src/app/(dashboard)/candidates/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Button } from '@/components/ui/Button/Button';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Badge } from '@/components/ui/Badge/Badge';
import { Modal } from '@/components/ui/Modal/Modal';
import { useToast } from '@/context/ToastContext';
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
  Plus,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Eye,
} from 'lucide-react';
import styles from './Candidates.module.css';

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
}

export default function CandidatesPage() {
  const { toast } = useToast();
  // Listing Data States
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Query States
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [role, setRole] = useState('ALL');
  const [claimStatus, setClaimStatus] = useState('ALL');
  const [overallStatus, setOverallStatus] = useState('ALL');
  const [ipaStatus, setIpaStatus] = useState('ALL');
  
  // Pagination States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sorting States
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Multi-row Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  // Add Candidate Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRefId, setNewRefId] = useState('');
  const [newName, setNewName] = useState('');
  const [newQual, setNewQual] = useState('');
  const [newSpec, setNewSpec] = useState('');
  const [newRole, setNewRole] = useState('NINJA');
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Fetch Candidates from API
  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        sortOrder,
      });

      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (role !== 'ALL') queryParams.append('role', role);
      if (claimStatus !== 'ALL') queryParams.append('claimStatus', claimStatus);
      if (overallStatus !== 'ALL') queryParams.append('status', overallStatus);
      if (ipaStatus !== 'ALL') queryParams.append('ipaStatus', ipaStatus);

      const res = await fetch(`/api/candidates?${queryParams.toString()}`);
      const data = await res.json();

      if (data.success) {
        setCandidates(data.data);
        setTotalCount(data.meta.total);
        setTotalPages(data.meta.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, debouncedSearch, role, claimStatus, overallStatus, ipaStatus]);

  useEffect(() => {
    fetchCandidates();
    // Reset selection on filter changes
    setSelectedIds([]);
  }, [fetchCandidates]);

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page
  };

  // Handle Sort Header Clicks
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Handle Selection checkbox changes
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = candidates.map((c) => c.id);
      setSelectedIds(pageIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Execute Bulk Action
  const handleBulkActionExecute = async () => {
    if (!bulkAction || selectedIds.length === 0) return;

    const confirmMsg = `Are you sure you want to perform this bulk update on ${selectedIds.length} candidate(s)?`;
    if (!window.confirm(confirmMsg)) return;

    setIsLoading(true);
    try {
      const isWithdraw = bulkAction === 'withdraw';
      const res = await fetch('/api/candidates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          action: isWithdraw ? 'withdraw' : 'status-update',
          value: isWithdraw ? undefined : bulkAction,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedIds([]);
        setBulkAction('');
        fetchCandidates();
        toast.success('Bulk action completed successfully.');
      } else {
        toast.error(data.error || 'Bulk update failed');
      }
    } catch (err) {
      console.error('Error running bulk action:', err);
      toast.error('Error running bulk action');
    } finally {
      setIsLoading(false);
    }
  };

  // Connect CSV Export
  const handleCSVExport = () => {
    const queryParams = new URLSearchParams();
    if (debouncedSearch) queryParams.append('search', debouncedSearch);
    if (role !== 'ALL') queryParams.append('role', role);
    if (claimStatus !== 'ALL') queryParams.append('claimStatus', claimStatus);
    if (overallStatus !== 'ALL') queryParams.append('status', overallStatus);

    // Trigger browser file download directly
    window.open(`/api/candidates/export?${queryParams.toString()}`, '_blank');
  };

  // Submit Manual Add Candidate Form
  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setIsAdding(true);

    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: newRefId,
          name: newName,
          qualification: newQual,
          specialization: newSpec,
          selectedRole: newRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create candidate profile');
      }

      // Reset Form fields and Close Modal
      setIsAddModalOpen(false);
      setNewRefId('');
      setNewName('');
      setNewQual('');
      setNewSpec('');
      setNewRole('NINJA');
      
      // Refresh list
      fetchCandidates();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsAdding(false);
    }
  };

  // Dynamic Status Color maps
  const getClaimBadge = (status: string) => {
    switch (status) {
      case 'CLAIMED':
        return <Badge variant="success">Claimed</Badge>;
      case 'DISPUTED':
        return <Badge variant="error" glow>Disputed</Badge>;
      default:
        return <Badge variant="neutral">Unclaimed</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'JOINED':
        return <Badge variant="success">Joined</Badge>;
      case 'DEFERRED':
        return <Badge variant="warning">Deferred</Badge>;
      case 'WITHDRAWN':
        return <Badge variant="error">Withdrawn</Badge>;
      case 'NO_SHOW':
        return <Badge variant="error" glow>No Show</Badge>;
      default:
        return <Badge variant="info">Active</Badge>;
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

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown size={12} className={styles.sortIcon} />;
    return sortOrder === 'asc' ? (
      <ArrowUp size={12} className={styles.sortIconActive} />
    ) : (
      <ArrowDown size={12} className={styles.sortIconActive} />
    );
  };

  const allSelected = candidates.length > 0 && selectedIds.length === candidates.length;

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="Candidate Registry"
        description="Search, view, and manage all campus-selected candidates pre-joining onboarding checklists."
        breadcrumbs={[{ label: 'Dashboard', href: '/overview' }, { label: 'Candidates' }]}
        actions={
          <div className={styles.actions}>
            <Button variant="outline" onClick={handleCSVExport}>
              <Download size={16} style={{ marginRight: '8px' }} />
              Export CSV
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus size={16} style={{ marginRight: '8px' }} />
              Add Candidate
            </Button>
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
              onChange={handleSearchChange}
            />
          </div>

          <div className={styles.filtersGrid}>
            <Select
              label="Selected Offer"
              value={role}
              onChange={(e) => { setRole(e.target.value); setPage(1); }}
              options={[
                { value: 'ALL', label: 'All Offers' },
                { value: 'PRIME', label: 'Prime' },
                { value: 'DIGITAL', label: 'Digital' },
                { value: 'NINJA', label: 'Ninja' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
            <Select
              label="Claim Status"
              value={claimStatus}
              onChange={(e) => { setClaimStatus(e.target.value); setPage(1); }}
              options={[
                { value: 'ALL', label: 'All Claims' },
                { value: 'UNCLAIMED', label: 'Unclaimed' },
                { value: 'CLAIMED', label: 'Claimed' },
                { value: 'DISPUTED', label: 'Disputed' },
              ]}
            />
            <Select
              label="Overall Status"
              value={overallStatus}
              onChange={(e) => { setOverallStatus(e.target.value); setPage(1); }}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'DEFERRED', label: 'Deferred' },
                { value: 'WITHDRAWN', label: 'Withdrawn' },
                { value: 'JOINED', label: 'Joined' },
                { value: 'NO_SHOW', label: 'No Show' },
              ]}
            />
            <Select
              label="IPA Status"
              value={ipaStatus}
              onChange={(e) => { setIpaStatus(e.target.value); setPage(1); }}
              options={[
                { value: 'ALL', label: 'All IPA Statuses' },
                { value: 'NOT_ATTEMPTED', label: 'Not Attempted' },
                { value: 'FAILED', label: 'Failed' },
                { value: 'CLEARED', label: 'Cleared' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* REGISTRY TABLE */}
      <TableContainer>
        <Table>
          <THead>
            <TR>
              <TH style={{ width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  aria-label="Select all candidates on page"
                />
              </TH>
              <TH onClick={() => handleSort('referenceId')} className={styles.sortableHeader}>
                Reference ID {getSortIcon('referenceId')}
              </TH>
              <TH onClick={() => handleSort('name')} className={styles.sortableHeader}>
                Name {getSortIcon('name')}
              </TH>
              <TH onClick={() => handleSort('selectedRole')} className={styles.sortableHeader}>
                Role {getSortIcon('selectedRole')}
              </TH>
              <TH onClick={() => handleSort('claimStatus')} className={styles.sortableHeader}>
                Claim Status {getSortIcon('claimStatus')}
              </TH>
              <TH>Current Milestone</TH>
              <TH onClick={() => handleSort('ipaStatus')} className={styles.sortableHeader}>
                IPA Status {getSortIcon('ipaStatus')}
              </TH>
              <TH style={{ textAlign: 'center' }}>IPA Attempts</TH>
              <TH onClick={() => handleSort('overallStatus')} className={styles.sortableHeader}>
                Status {getSortIcon('overallStatus')}
              </TH>
              <TH style={{ textAlign: 'center' }}>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {isLoading ? (
              // Loading Skeleton Placeholders
              Array.from({ length: 5 }).map((_, i) => (
                <TR key={`skeleton-${i}`}>
                  <TD><div className={styles.skeletonCheckbox} /></TD>
                  <TD><div className={styles.skeletonText} style={{ width: '80px' }} /></TD>
                  <TD><div className={styles.skeletonText} style={{ width: '130px' }} /></TD>
                  <TD><div className={styles.skeletonText} style={{ width: '60px' }} /></TD>
                  <TD><div className={styles.skeletonText} style={{ width: '70px' }} /></TD>
                  <TD><div className={styles.skeletonText} style={{ width: '120px' }} /></TD>
                  <TD><div className={styles.skeletonText} style={{ width: '80px' }} /></TD>
                  <TD><div className={styles.skeletonText} style={{ width: '70px' }} /></TD>
                  <TD><div className={styles.skeletonText} style={{ width: '60px' }} /></TD>
                  <TD><div className={styles.skeletonBtn} /></TD>
                </TR>
              ))
            ) : candidates.length > 0 ? (
              candidates.map((cand) => (
                <TR key={cand.id} className={styles.tableRow}>
                  <TD style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(cand.id)}
                      onChange={(e) => handleSelectRow(cand.id, e.target.checked)}
                      aria-label={`Select ${cand.name}`}
                    />
                  </TD>
                  <TD className={styles.mono}>{cand.referenceId}</TD>
                  <TD style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{cand.name}</TD>
                  <TD style={{ textTransform: 'capitalize', fontSize: '0.8rem', fontWeight: 600 }}>{cand.selectedRole.toLowerCase()}</TD>
                  <TD>{getClaimBadge(cand.claimStatus)}</TD>
                  <TD style={{ fontSize: '0.8125rem' }}>
                    {cand.currentStage.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                  </TD>
                  <TD style={{ textAlign: 'center' }}>
                    {getIpaBadge(cand.ipaStatus)}
                  </TD>
                  <TD style={{ textAlign: 'center', fontSize: '0.8125rem' }}>
                    {cand.ipaAttempts} {cand.ipaScore !== null ? `(${cand.ipaScore}%)` : ''}
                  </TD>
                  <TD>{getStatusBadge(cand.overallStatus)}</TD>
                  <TD style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <Link href={`/candidates/${cand.id}`}>
                      <Button size="sm" variant="ghost" className={styles.viewBtn}>
                        <Eye size={14} style={{ marginRight: '6px' }} />
                        View
                      </Button>
                    </Link>
                  </TD>
                </TR>
              ))
            ) : (
              <TR>
                <TD colSpan={10} className={styles.emptyState}>
                  <AlertCircle size={24} className={styles.emptyIcon} />
                  <p>No candidates found matching the query filters.</p>
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </TableContainer>

      {/* PAGINATION PANEL */}
      {!isLoading && candidates.length > 0 && (
        <div className={styles.paginationPanel}>
          <div className={styles.paginationMeta}>
            Showing <strong>{Math.min(totalCount, (page - 1) * pageSize + 1)}</strong> to{' '}
            <strong>{Math.min(totalCount, page * pageSize)}</strong> of{' '}
            <strong>{totalCount}</strong> candidates
          </div>

          <div className={styles.paginationActions}>
            <Select
              className={styles.pageSizeSelect}
              value={pageSize.toString()}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(1);
              }}
              options={[
                { value: '10', label: '10 per page' },
                { value: '25', label: '25 per page' },
                { value: '50', label: '50 per page' },
                { value: '100', label: '100 per page' },
              ]}
            />

            <div className={styles.pageButtons}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </Button>
              <span className={styles.pageIndicator}>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BULK ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className={styles.bulkActionBar}>
          <div className={styles.bulkCount}>
            <strong>{selectedIds.length}</strong> candidates selected
          </div>
          <div className={styles.bulkOperations}>
            <Select
              className={styles.bulkSelectAction}
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              options={[
                { value: '', label: 'Choose bulk action...' },
                { value: 'ACTIVE', label: 'Mark Active' },
                { value: 'DEFERRED', label: 'Mark Deferred' },
                { value: 'JOINED', label: 'Mark Joined' },
                { value: 'NO_SHOW', label: 'Mark No Show' },
                { value: 'withdraw', label: 'Withdraw Candidate (Delete)' },
              ]}
            />
            <Button
              size="sm"
              variant={bulkAction === 'withdraw' ? 'danger' : 'primary'}
              disabled={!bulkAction}
              onClick={handleBulkActionExecute}
            >
              Apply Action
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ADD CANDIDATE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddError(null);
        }}
        title="Add Single Candidate"
        size="md"
      >
        {addError && (
          <div className={styles.modalError} role="alert">
            <AlertCircle size={16} style={{ marginRight: '8px' }} />
            {addError}
          </div>
        )}
        <form onSubmit={handleAddCandidate} className={styles.modalForm}>
          <Input
            label="TCS Reference ID"
            placeholder="e.g. DT2023XXXXXXXX or CT2025XXXXXXXX"
            value={newRefId}
            onChange={(e) => setNewRefId(e.target.value)}
            required
            disabled={isAdding}
          />
          <Input
            label="Candidate Full Name"
            placeholder="e.g. Priyanshu Pal"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            disabled={isAdding}
          />
          <div className={styles.formGrid}>
            <Input
              label="Qualification"
              placeholder="e.g. BACHELOR OF TECHNOLOGY"
              value={newQual}
              onChange={(e) => setNewQual(e.target.value)}
              disabled={isAdding}
            />
            <Input
              label="Specialization"
              placeholder="e.g. COMPUTER SCIENCE"
              value={newSpec}
              onChange={(e) => setNewSpec(e.target.value)}
              disabled={isAdding}
            />
          </div>
          <Select
            label="Approved Offer Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            disabled={isAdding}
            options={[
              { value: 'NINJA', label: 'Ninja' },
              { value: 'DIGITAL', label: 'Digital' },
              { value: 'PRIME', label: 'Prime' },
              { value: 'OTHER', label: 'Other' },
            ]}
          />
          <div className={styles.modalActions}>
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isAdding}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
