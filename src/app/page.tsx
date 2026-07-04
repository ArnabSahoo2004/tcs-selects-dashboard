import prisma from '@/lib/prisma';
import styles from './page.module.css';
import SearchAndClaim from '@/components/ui/SearchAndClaim/SearchAndClaim';
import DashboardCharts from '@/components/ui/DashboardCharts/DashboardCharts';
import HomeHeader from '@/components/ui/HomeHeader/HomeHeader';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const revalidate = 60; // Revalidate stats every 60 seconds

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

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
    offCampus,
    bgcStarted
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
    prisma.candidate.count({ where: { bgcStarted: true } }),
  ]);

  const claimPercentage = totalCandidates > 0 ? Math.round((claimedProfiles / totalCandidates) * 100) : 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.title}>TCS Selects Dashboard</div>
          <HomeHeader />
        </div>
      </header>

      <main className={styles.main}>
        {/* Stats Section */}
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Public Tracker Stats</h1>
          <p className={styles.heroSubtitle}>Live overview of offer rollouts and joining progress across all candidates.</p>
        </div>

        {!isLoggedIn && (
          <div style={{ marginBottom: '4rem' }}>
            <SearchAndClaim />
          </div>
        )}

        <div className={styles.statsGrid}>
          {/* Main Progress Cards */}
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Total Candidates</h3>
            <div className={styles.statValueContainer}>
              <div className={styles.statValue}>{totalCandidates}</div>
            </div>
            <div className={styles.statSubtext}>Across all campuses</div>
          </div>
          
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Profiles Claimed</h3>
            <div className={styles.statValueContainer}>
              <div className={styles.statValue}>{claimedProfiles}</div>
              <div className={styles.statTrend}>▲ 8%</div>
            </div>
            <div className={styles.statSubtext}>{claimPercentage}% Engagement rate</div>
          </div>

          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Offer Letters Issued</h3>
            <div className={styles.statValueContainer}>
              <div className={styles.statValue}>{offerLetters}</div>
            </div>
            <div className={styles.statSubtext}>Waiting for acceptance</div>
          </div>

          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>JRS Form Submitted</h3>
            <div className={styles.statValueContainer}>
              <div className={styles.statValue}>{jrsAssigned}</div>
            </div>
            <div className={styles.statSubtext}>Candidates who submitted JRS</div>
          </div>

          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Joining Letters</h3>
            <div className={styles.statValueContainer}>
              <div className={styles.statValue}>{joiningLetters}</div>
              <div className={styles.statTrend}>▲ 20%</div>
            </div>
            <div className={styles.statSubtext}>Final Step completions</div>
          </div>

          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>BGC Started</h3>
            <div className={styles.statValueContainer}>
              <div className={styles.statValue}>{bgcStarted}</div>
              <div className={styles.statTrend}>▲ 11%</div>
            </div>
            <div className={styles.statSubtext}>Currently in progress</div>
          </div>
        </div>

        {/* Demographics Charts */}
        <div className={styles.sectionTitle}>Analytics</div>
        <DashboardCharts stats={{
          totalCandidates,
          claimedProfiles,
          offerLetters,
          jrsAssigned,
          joiningLetters,
          primeRole,
          digitalRole,
          ninjaRole,
          onCampus,
          offCampus,
          bgcStarted
        }} />

      </main>
    </div>
  );
}
