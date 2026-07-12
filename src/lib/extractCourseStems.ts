import { Chess } from 'chess.js';
import { lineTrainIndicesForMode } from './courseLineMastery';
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

function countTrainSlots(
  startFen: string,
  movesUci: readonly string[],
  trainSide: TrainSide,
  depth: number,
): number {
  return lineTrainIndicesForMode(startFen, movesUci.slice(0, depth), trainSide)
    .length;
}

function buildTrie(
  lessons: readonly LessonStemInput[],
  startFen: string,
): TrieNode {
  const root: TrieNode = { depth: 0, children: new Map(), lessonIndexes: new Set() };
  lessons.forEach((lesson, lessonIndex) => {
    let node = root;
    node.lessonIndexes.add(lessonIndex);
    const fen = lesson.startFen ?? startFen;
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
  });
  return root;
}

function collectStemNodes(
  node: TrieNode,
  path: string[],
  output: Array<{ path: string[]; depth: number; lessonIndexes: Set<number> }>,
): void {
  const isShared = node.lessonIndexes.size >= 2;
  const isBranch = node.children.size >= 2;
  if (node.depth > 0 && (isShared || isBranch)) {
    output.push({
      path: [...path],
      depth: node.depth,
      lessonIndexes: node.lessonIndexes,
    });
  }
  for (const [uci, child] of node.children) {
    collectStemNodes(child, [...path, uci], output);
  }
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
  const trie = buildTrie(lessons, startFen);
  const rawNodes: Array<{
    path: string[];
    depth: number;
    lessonIndexes: Set<number>;
  }> = [];
  collectStemNodes(trie, [], rawNodes);

  const uniqueByKey = new Map<
    string,
    { path: string[]; depth: number; lessonIndexes: Set<number> }
  >();
  for (const node of rawNodes) {
    if (node.depth < minStemDepth) {
      continue;
    }
    const key = stemKeyFromPath(node.path);
    const existing = uniqueByKey.get(key);
    if (!existing || node.lessonIndexes.size > existing.lessonIndexes.size) {
      uniqueByKey.set(key, node);
    }
  }

  const sorted = [...uniqueByKey.values()].sort((a, b) => {
    if (a.depth !== b.depth) {
      return a.depth - b.depth;
    }
    return stemKeyFromPath(a.path).localeCompare(stemKeyFromPath(b.path));
  });

  const stems: CourseStem[] = sorted.map((node) => {
    const representativeLesson = lessons[[...node.lessonIndexes][0]!]!;
    const lessonStartFen = representativeLesson.startFen ?? startFen;
    const stemN = representativeLesson.NPerPly?.[node.depth - 1];
    return {
      stemKey: stemKeyFromPath(node.path),
      depth: node.depth,
      endFen: fenAtPly(lessonStartFen, representativeLesson.movesUci, node.depth),
      trainSlots: countTrainSlots(
        lessonStartFen,
        representativeLesson.movesUci,
        representativeLesson.trainSide,
        node.depth,
      ),
      ...(stemN !== undefined ? { N: stemN } : {}),
    };
  });

  const stemIdByKey = new Map(stems.map((stem, index) => [stem.stemKey, index]));
  const lessonStemIds = lessons.map((lesson) => {
    const ids: number[] = [];
    for (let ply = 1; ply <= lesson.movesUci.length; ply += 1) {
      const key = stemKeyFromPath(lesson.movesUci.slice(0, ply));
      const stemId = stemIdByKey.get(key);
      if (stemId !== undefined) {
        ids.push(stemId);
      }
    }
    return ids;
  });

  return { stems, lessonStemIds };
}
