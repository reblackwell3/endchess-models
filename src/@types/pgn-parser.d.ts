declare module 'pgn-parser' {
  export interface PgnHeader {
    name: string;
    value: string;
  }

  export interface PgnMove {
    move: string;
    move_number?: number;
    comments?: Array<string | { text?: string } | Record<string, unknown>>;
  }

  export interface PgnGame {
    headers: PgnHeader[] | null;
    moves: PgnMove[];
    result: string | null;
  }

  export function parse(pgn: string): PgnGame[];

  const _default: { parse: typeof parse };
  export default _default;
}
