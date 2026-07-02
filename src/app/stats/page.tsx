import prisma from '@/lib/prisma';
import styles from './Stats.module.css';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 60; // Revalidate stats every 60 seconds

export default async function StatsPage() {
  // Run all aggregations in parallel
  const [
    totalCandidates,
    claimedProfiles,
    offerLetters,
    jrsAssigned,
    joiningLetters,
    primeRole,
    digitalRole,
    ninjaRole,
    onCampus,
    offCampus
  ] = await Promise.all([
    prisma.candidate.count(),
    prisma.candidate.count({ where: { claimStatus: 'CLAIMED' } }),
    prisma.candidate.count({ where: { offerLetterDate: { not: null } } }),
    prisma.candidate.count({ where: { jrsDate: { not: null } } }),
    prisma.candidate.count({ where: { joiningDate: { not: null } } }),
    prisma.candidate.count({ where: { selectedRole: { equals: 'PRIME', mode: 'insensitive' } } }),
    prisma.candidate.count({ where: { selectedRole: { equals: 'DIGITAL', mode: 'insensitive' } } }),
    prisma.candidate.count({ where: { selectedRole: { equals: 'NINJA', mode: 'insensitive' } } }),
    prisma.candidate.count({ where: { campusType: 'On Campus' } }),
    prisma.candidate.count({ where: { campusType: 'Off Campus' } }),
  ]);

  const claimPercentage = totalCandidates > 0 ? Math.round((claimedProfiles / totalCandidates) * 100) : 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.title}>Offer Tracker Dashboard</div>
          <Link href="/" className={styles.backBtn}>
            <ArrowLeft size={18} /> Back to Search
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Public Tracker Stats</h1>
          <p className={styles.heroSubtitle}>Live overview of offer rollouts and joining progress across all candidates.</p>
        </div>

        <div className={styles.statsGrid}>
          {/* Main Progress Cards */}
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Total Candidates</h3>
            <div className={styles.statValue}>{totalCandidates}</div>
          </div>
          
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Profiles Claimed</h3>
            <div className={styles.statValue}>{claimedProfiles}</div>
            <div className={styles.statSubtext}>{claimPercentage}% Engagement</div>
          </div>

          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Offer Letters Issued</h3>
            <div className={styles.statValue}>{offerLetters}</div>
          </div>

          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>JRS Sessions Date</h3>
            <div className={styles.statValue}>{jrsAssigned}</div>
          </div>

          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Joining Letters Issued</h3>
            <div className={styles.statValue}>{joiningLetters}</div>
            <div className={styles.statSubtext}>Final Step</div>
          </div>

          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>BGC Started</h3>
            <div className={styles.statValue}>{await prisma.candidate.count({ where: { bgcStarted: true } })}</div>
          </div>
        </div>

        {/* Demographics */}
        <div className={styles.sectionTitle}>Breakdowns</div>
        
        <div className={styles.breakdownGrid}>
          <div className={styles.breakdownCard}>
            <h3>By Role</h3>
            <div className={styles.breakdownRow}>
              <span>Prime</span>
              <strong>{primeRole}</strong>
            </div>
            <div className={styles.breakdownRow}>
              <span>Digital</span>
              <strong>{digitalRole}</strong>
            </div>
            <div className={styles.breakdownRow}>
              <span>Ninja</span>
              <strong>{ninjaRole}</strong>
            </div>
          </div>

          <div className={styles.breakdownCard}>
            <h3>By Campus Type</h3>
            <div className={styles.breakdownRow}>
              <span>On Campus</span>
              <strong>{onCampus}</strong>
            </div>
            <div className={styles.breakdownRow}>
              <span>Off Campus</span>
              <strong>{offCampus}</strong>
            </div>
            <div className={styles.breakdownRow}>
              <span style={{color: '#999'}}>Unspecified</span>
              <strong style={{color: '#999'}}>{totalCandidates - onCampus - offCampus}</strong>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
