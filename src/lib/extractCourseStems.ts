import { Chess } from 'chess.js';
import { lineTrainIndicesForMode } from './courseLineMastery';
import { positionKey } from './positionUtils';
import type { CourseStem, TrainSide } from '../models/course/courseTypes';

export type LessonStemInput = {
  movesUci: readonly string[];
  trainSide: TrainSide;
  startFen?: string;
  /** Elite-DB game count after each ply (index = ply - 1); opening popularity only. */
  NPerPly?: readonly number[];
};

export type ExtractedCourseStems = {
  stems: CourseStem[];
  lessonStemIds: number[][];
};

const DEFAULT_MIN_STEM_DEPTH = 1;

const applyUci = (chess: Chess, uci: string): void => {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;
  const move = chess.move({ from, to, promotion });
  if (!move) {
    throw new Error(`Illegal UCI move: ${uci}`);
  }
};

type TrieNode = {
  depth: number;
  children: Map<string, TrieNode>;
  lessonIndexes: Set<number>;
};

type StemCandidate = {
  path: string[];
  depth: number;
  lessonIndexes: Set<number>;
  startKey: string;
  endFen: string;
  endKey: string;
  trainUcis: string[];
  trainSide: TrainSide;
  N?: number;
};

function fenAtPly(startFen: string, movesUci: readonly string[], ply: number): string {
  const chess = new Chess(startFen);
  for (let index = 0; index < ply && index < movesUci.length; index += 1) {
    applyUci(chess, movesUci[index]!);
  }
  return chess.fen();
}

function stemKeyFromPath(path: readonly string[]): string {
  return path.join('|');
}

function candidateIdentityKey(candidate: StemCandidate): string {
  return [
    candidate.startKey,
    candidate.trainSide,
    stemKeyFromPath(candidate.path),
  ].join('\0');
}

function trainUcisForPrefix(
  startFen: string,
  movesUci: readonly string[],
  trainSide: TrainSide,
  depth: number,
): string[] {
  const prefix = movesUci.slice(0, depth);
  return lineTrainIndicesForMode(startFen, prefix, trainSide).map(
    (index) => prefix[index]!,
  );
}

function buildTrie(
  lessons: readonly LessonStemInput[],
  lessonIndexes: readonly number[],
  defaultStartFen: string,
): TrieNode {
  const root: TrieNode = { depth: 0, children: new Map(), lessonIndexes: new Set() };
  for (const lessonIndex of lessonIndexes) {
    const lesson = lessons[lessonIndex]!;
    let node = root;
    node.lessonIndexes.add(lessonIndex);
    const fen = lesson.startFen ?? defaultStartFen;
    const chess = new Chess(fen);
    for (const uci of lesson.movesUci) {
      let child = node.children.get(uci);
      if (!child) {
        child = {
          depth: node.depth + 1,
          children: new Map(),
          lessonIndexes: new Set(),
        };
        node.children.set(uci, child);
      }
      child.lessonIndexes.add(lessonIndex);
      node = child;
      applyUci(chess, uci);
    }
  }
  return root;
}

function enrichCandidate(
  lessons: readonly LessonStemInput[],
  defaultStartFen: string,
  path: string[],
  depth: number,
  lessonIndexes: Set<number>,
): StemCandidate {
  const representativeLesson = lessons[[...lessonIndexes][0]!]!;
  const lessonStartFen = representativeLesson.startFen ?? defaultStartFen;
  const endFen = fenAtPly(lessonStartFen, path, depth);
  const trainUcis = trainUcisForPrefix(
    lessonStartFen,
    path,
    representativeLesson.trainSide,
    depth,
  );
  const stemN = representativeLesson.NPerPly?.[depth - 1];
  return {
    path,
    depth,
    lessonIndexes: new Set(lessonIndexes),
    startKey: positionKey(lessonStartFen),
    endFen,
    endKey: positionKey(endFen),
    trainUcis,
    trainSide: representativeLesson.trainSide,
    ...(stemN !== undefined ? { N: stemN } : {}),
  };
}

function collectPathStemNodes(
  node: TrieNode,
  path: string[],
  lessons: readonly LessonStemInput[],
  defaultStartFen: string,
  output: StemCandidate[],
): void {
  const isShared = node.lessonIndexes.size >= 2;
  const isBranch = node.children.size >= 2;
  if (node.depth > 0 && (isShared || isBranch)) {
    output.push(
      enrichCandidate(
        lessons,
        defaultStartFen,
        [...path],
        node.depth,
        node.lessonIndexes,
      ),
    );
  }
  for (const [uci, child] of node.children) {
    collectPathStemNodes(
      child,
      [...path, uci],
      lessons,
      defaultStartFen,
      output,
    );
  }
}

/**
 * Emit stems for prefixes that reach the same board via different move orders
 * (same depth), even when no single UCI path is shared by ≥2 lessons.
 */
function collectPositionSharedStems(
  lessons: readonly LessonStemInput[],
  startFen: string,
  minStemDepth: number,
): StemCandidate[] {
  const maxDepth = lessons.reduce(
    (max, lesson) => Math.max(max, lesson.movesUci.length),
    0,
  );
  const output: StemCandidate[] = [];

  for (let depth = minStemDepth; depth <= maxDepth; depth += 1) {
    const byEndKey = new Map<
      string,
      Array<{ lessonIndex: number; path: string[] }>
    >();

    lessons.forEach((lesson, lessonIndex) => {
      if (lesson.movesUci.length < depth) {
        return;
      }
      const path = lesson.movesUci.slice(0, depth) as string[];
      const lessonStartFen = lesson.startFen ?? startFen;
      const endKey = positionKey(fenAtPly(lessonStartFen, path, depth));
      const entries = byEndKey.get(endKey) ?? [];
      entries.push({ lessonIndex, path });
      byEndKey.set(endKey, entries);
    });

    for (const entries of byEndKey.values()) {
      if (entries.length < 2) {
        continue;
      }
      const uniquePaths = new Map<string, StemCandidate>();
      for (const entry of entries) {
        const lesson = lessons[entry.lessonIndex]!;
        const lessonStartFen = lesson.startFen ?? startFen;
        const identity = [
          positionKey(lessonStartFen),
          lesson.trainSide,
          stemKeyFromPath(entry.path),
        ].join('\0');
        const existing = uniquePaths.get(identity);
        if (!existing) {
          uniquePaths.set(
            identity,
            enrichCandidate(
              lessons,
              startFen,
              entry.path,
              depth,
              new Set([entry.lessonIndex]),
            ),
          );
        } else {
          existing.lessonIndexes.add(entry.lessonIndex);
        }
      }
      // Only emit when ≥2 distinct move orders reach this position.
      const distinctPaths = new Set(
        [...uniquePaths.values()].map((c) => stemKeyFromPath(c.path)),
      );
      if (distinctPaths.size < 2) {
        continue;
      }
      output.push(...uniquePaths.values());
    }
  }

  return output;
}

function mergeCandidates(
  candidates: readonly StemCandidate[],
  minStemDepth: number,
): StemCandidate[] {
  const uniqueByKey = new Map<string, StemCandidate>();
  for (const node of candidates) {
    if (node.depth < minStemDepth) {
      continue;
    }
    const key = candidateIdentityKey(node);
    const existing = uniqueByKey.get(key);
    if (!existing) {
      uniqueByKey.set(key, {
        ...node,
        lessonIndexes: new Set(node.lessonIndexes),
      });
      continue;
    }
    for (const lessonIndex of node.lessonIndexes) {
      existing.lessonIndexes.add(lessonIndex);
    }
  }
  return [...uniqueByKey.values()].sort((a, b) => {
    if (a.depth !== b.depth) {
      return a.depth - b.depth;
    }
    const keyA = candidateIdentityKey(a);
    const keyB = candidateIdentityKey(b);
    return keyA.localeCompare(keyB);
  });
}

/** Build a numbered stem catalog and per-lesson stem id chains from lesson lines. */
export function extractCourseStems(
  lessons: readonly LessonStemInput[],
  options: { startFen?: string; minStemDepth?: number } = {},
): ExtractedCourseStems {
  if (lessons.length === 0) {
    return { stems: [], lessonStemIds: [] };
  }

  const startFen = options.startFen ?? new Chess().fen();
  const minStemDepth = options.minStemDepth ?? DEFAULT_MIN_STEM_DEPTH;

  // Path-prefix stems are computed per (startKey, trainSide) so identical UCI
  // text from different starting positions never share an endKey.
  const groups = new Map<string, number[]>();
  lessons.forEach((lesson, lessonIndex) => {
    const lessonStartFen = lesson.startFen ?? startFen;
    const groupKey = `${positionKey(lessonStartFen)}\0${lesson.trainSide}`;
    const indexes = groups.get(groupKey) ?? [];
    indexes.push(lessonIndex);
    groups.set(groupKey, indexes);
  });

  const pathNodes: StemCandidate[] = [];
  for (const lessonIndexes of groups.values()) {
    const trie = buildTrie(lessons, lessonIndexes, startFen);
    collectPathStemNodes(trie, [], lessons, startFen, pathNodes);
  }

  const positionNodes = collectPositionSharedStems(
    lessons,
    startFen,
    minStemDepth,
  );
  const sorted = mergeCandidates([...pathNodes, ...positionNodes], minStemDepth);

  const stems: CourseStem[] = sorted.map((node) => ({
    stemKey: stemKeyFromPath(node.path),
    depth: node.depth,
    endFen: node.endFen,
    endKey: node.endKey,
    trainSlots: node.trainUcis.length,
    trainUcis: node.trainUcis,
    ...(node.N !== undefined ? { N: node.N } : {}),
  }));

  const lessonStemIds = lessons.map(() => [] as number[]);
  sorted.forEach((candidate, stemId) => {
    for (const lessonIndex of candidate.lessonIndexes) {
      lessonStemIds[lessonIndex]!.push(stemId);
    }
  });
  for (const ids of lessonStemIds) {
    ids.sort((a, b) => {
      const depthDiff = (sorted[a]?.depth ?? 0) - (sorted[b]?.depth ?? 0);
      if (depthDiff !== 0) {
        return depthDiff;
      }
      return a - b;
    });
  }

  return { stems, lessonStemIds };
}
