import type { CourseAlgorithm, CourseMetadata } from '../models/course/courseTypes';

type LegacyCourseFilters = {
  minElo: number;
  maxElo: number;
  sources: string[];
  numGamesUsed?: number;
  gameBudget?: number;
};

/** Course row shape for resolving metadata (lean document or publish input). */
export type CourseMetadataSource = {
  generatedAt?: Date;
  algorithm?: CourseAlgorithm;
  filters?: LegacyCourseFilters;
  metadata?: CourseMetadata;
};

function resolveFilters(filters: LegacyCourseFilters): NonNullable<CourseMetadata['filters']> {
  return {
    minElo: filters.minElo,
    maxElo: filters.maxElo,
    sources: [...filters.sources],
    numGamesUsed: filters.numGamesUsed ?? filters.gameBudget ?? 0,
  };
}

function nestedMetadataFiltersArePopulated(
  filters: CourseMetadata['filters'] | undefined,
): boolean {
  if (!filters) {
    return false;
  }
  return (
    (filters.sources?.length ?? 0) > 0 || (filters.numGamesUsed ?? 0) > 0
  );
}

/** Merge nested metadata with legacy top-level publish fields. */
export function resolveCourseMetadata(course: CourseMetadataSource): CourseMetadata {
  const generatedAt = course.metadata?.generatedAt ?? course.generatedAt;
  const algorithm = course.metadata?.algorithm ?? course.algorithm;
  const rawFilters = nestedMetadataFiltersArePopulated(course.metadata?.filters)
    ? course.metadata!.filters!
    : course.filters;
  const builderCommitSha = course.metadata?.builderCommitSha;
  const builderSourceHash = course.metadata?.builderSourceHash;

  const metadata: CourseMetadata = {};
  if (generatedAt) {
    metadata.generatedAt = generatedAt;
  }
  if (algorithm) {
    metadata.algorithm = algorithm;
  }
  if (rawFilters) {
    metadata.filters = resolveFilters(rawFilters);
  }
  if (builderCommitSha) {
    metadata.builderCommitSha = builderCommitSha;
  }
  if (builderSourceHash) {
    metadata.builderSourceHash = builderSourceHash;
  }
  return metadata;
}

export function isCourseMetadataEmpty(metadata: CourseMetadata): boolean {
  return (
    metadata.generatedAt == null &&
    metadata.algorithm == null &&
    metadata.filters == null &&
    metadata.builderCommitSha == null &&
    metadata.builderSourceHash == null
  );
}

/** True when top-level publish fields are not yet copied into metadata. */
export function courseNeedsMetadataBackfill(course: CourseMetadataSource): boolean {
  if (!course.metadata) {
    return course.generatedAt != null || course.algorithm != null || course.filters != null;
  }
  if (course.generatedAt && !course.metadata.generatedAt) {
    return true;
  }
  if (course.algorithm && !course.metadata.algorithm) {
    return true;
  }
  if (course.filters && !course.metadata.filters) {
    return true;
  }
  return false;
}

/** Metadata document to write on publish or backfill (dual-write era). */
export function buildCourseMetadataDocument(
  course: CourseMetadataSource,
  generatedAt: Date = new Date(),
): CourseMetadata {
  return resolveCourseMetadata({
    ...course,
    generatedAt: course.metadata?.generatedAt ?? course.generatedAt ?? generatedAt,
  });
}
