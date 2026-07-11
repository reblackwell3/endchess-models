export function parseCommaName(
  username: string,
): { last: string; first: string } | null {
  const idx = username.indexOf(',');
  if (idx < 0) {
    return null;
  }

  const last = username.slice(0, idx).trim();
  const first =
    username
      .slice(idx + 1)
      .trim()
      .replace(/\./g, '')
      .split(/\s+/)[0] ?? '';
  if (!last || !first) {
    return null;
  }

  return { last, first };
}

export function playerNameKey(username: string): string {
  const parsed = parseCommaName(username);
  if (!parsed) {
    return username.trim().toLowerCase();
  }

  return `${parsed.last.toLowerCase()},${parsed.first.charAt(0).toLowerCase()}`;
}

function firstNamePartLength(username: string): number {
  const parsed = parseCommaName(username);
  if (!parsed) {
    return username.length;
  }

  return parsed.first.length;
}

/** Prefer the spelling with the most complete first name (e.g. Magnus over M.). */
export function preferredDisplayUsername(usernames: string[]): string {
  return usernames.reduce((best, current) => {
    if (!best) {
      return current;
    }

    const currentFirstLen = firstNamePartLength(current);
    const bestFirstLen = firstNamePartLength(best);
    if (currentFirstLen > bestFirstLen) {
      return current;
    }
    if (currentFirstLen < bestFirstLen) {
      return best;
    }

    return current.length >= best.length ? current : best;
  });
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function usernameMatchRegex(username: string): RegExp {
  const parsed = parseCommaName(username);
  if (!parsed) {
    return new RegExp(`^${escapeRegex(username.trim())}$`, 'i');
  }

  const firstInitial = parsed.first.charAt(0);
  return new RegExp(
    `^${escapeRegex(parsed.last)},\\s*${escapeRegex(firstInitial)}[^,]*$`,
    'i',
  );
}

/** Case-insensitive substring match for player search fields. */
export function playerSearchRegex(query: string | undefined | null): RegExp {
  return new RegExp(escapeRegex((query ?? '').trim()), 'i');
}
