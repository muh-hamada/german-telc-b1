import { useMemo } from 'react';
import { useProgress } from '../contexts/ProgressContext';
import { activeExamConfig } from '../config/active-exam.config';
import { HistoricalResult } from '../types/exam.types';

export interface PartStat {
  examType: string;
  partNumber: number;
  attempted: number;       // number of distinct exams (by examId) with at least one attempt
  avgScore: number | null; // 0-100 percentage, null if no scored data
  bestScore: number | null; // 0-100 percentage, null if no scored data
  lastAttempt: number | null; // unix ms
  allHistory: HistoricalResult[]; // flat list across all examIds, sorted newest first
}

export interface SectionStats {
  stats: PartStat[];
  hasAnyAttempts: boolean;
}

/**
 * Computes per-part stats for a given section (e.g. 'reading', 'grammar')
 * using the parts defined in activeExamConfig.examStructure.
 */
export function useSectionStats(section: string): SectionStats {
  const { userProgress } = useProgress();

  return useMemo(() => {
    const examStructure = activeExamConfig.examStructure as Record<string, number[]>;
    const partNumbers: number[] = examStructure[section] ?? [];

    const stats: PartStat[] = partNumbers.map(partNumber => {
      const examType = `${section}-part${partNumber}`;
      const exams = (userProgress?.exams ?? []).filter(e => e.examType === examType);

      if (exams.length === 0) {
        return { examType, partNumber, attempted: 0, avgScore: null, bestScore: null, lastAttempt: null, allHistory: [] };
      }

      const attempted = exams.length;

      // Compute score percentages only for exams that have a valid maxScore
      const percentages = exams
        .filter(e => e.maxScore != null && e.maxScore > 0)
        .map(e => Math.round(((e.score ?? 0) / e.maxScore!) * 100));

      const avgScore = percentages.length > 0
        ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
        : null;

      const bestScore = percentages.length > 0 ? Math.max(...percentages) : null;

      const lastAttempt = Math.max(...exams.map(e => e.lastAttempt));

      // Flatten historical results across all exams, sort newest first
      const allHistory: HistoricalResult[] = exams
        .flatMap(e => e.historicalResults ?? [])
        .filter(h => h.maxScore > 0)
        .sort((a, b) => b.timestamp - a.timestamp);

      return { examType, partNumber, attempted, avgScore, bestScore, lastAttempt, allHistory };
    });

    const hasAnyAttempts = stats.some(s => s.attempted > 0);

    return { stats, hasAnyAttempts };
  }, [userProgress, section]);
}
