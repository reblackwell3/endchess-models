import { previewFromLessonLine } from '../src';

describe('previewFromLessonLine', () => {
  const startFen =
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';

  it('includes setupUci when the preview window starts at ply 0', () => {
    expect(
      previewFromLessonLine({
        startFen,
        setupUci: 'e2e4',
        movesSan: ['e5', 'Nf3', 'Nc6', 'Bb5'],
        movesUci: ['e7e5', 'g1f3', 'b8c6', 'f1b5'],
      }),
    ).toMatchObject({
      startFen,
      pgn: 'e5 Nf3 Nc6 Bb5',
      setupUci: 'e2e4',
    });
  });

  it('uses the move before the preview window when startIdx > 0', () => {
    const movesSan = [
      'e5',
      'Nf3',
      'Nc6',
      'Bb5',
      'a6',
      'Ba4',
      'b5',
      'Bb3',
      'Nf6',
      'O-O',
      'Be7',
      'Re1',
    ];
    const movesUci = [
      'e7e5',
      'g1f3',
      'b8c6',
      'f1b5',
      'a7a6',
      'b5a4',
      'b7b5',
      'a4b3',
      'g8f6',
      'e1g1',
      'f8e7',
      'f1e1',
    ];

    const preview = previewFromLessonLine({
      startFen,
      setupUci: 'e2e4',
      movesSan,
      movesUci,
    });

    expect(preview?.setupUci).toBe(movesUci[3]);
  });
});
