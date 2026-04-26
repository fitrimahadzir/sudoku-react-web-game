import { getSudoku } from 'sudoku-gen';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'sado';

export interface SudokuCell {
  row: number;
  col: number;
  value: number;
  solutionValue: number;
  isInitial: boolean;
  isError: boolean;
  notes: number[];
}

export interface SudokuBoardState {
  grid: SudokuCell[][];
  difficulty: Difficulty;
}

export const generateSudokuBoard = (difficulty: Difficulty = 'medium'): SudokuBoardState => {
  const genDifficulty = difficulty === 'sado' ? 'expert' : difficulty;
  const sudoku = getSudoku(genDifficulty);
  const puzzleStr = sudoku.puzzle;
  const solutionStr = sudoku.solution;

  const grid: SudokuCell[][] = [];
  for (let r = 0; r < 9; r++) {
    const row: SudokuCell[] = [];
    for (let c = 0; c < 9; c++) {
      const idx = r * 9 + c;
      const valStr = puzzleStr[idx];
      const solStr = solutionStr[idx];
      const val = valStr === '-' ? 0 : parseInt(valStr, 10);
      const sol = parseInt(solStr, 10);

      row.push({
        row: r,
        col: c,
        value: val,
        solutionValue: sol,
        isInitial: val !== 0,
        isError: false,
        notes: [],
      });
    }
    grid.push(row);
  }

  return {
    grid,
    difficulty: difficulty,
  };
};

export const checkCompletion = (grid: SudokuCell[][]): boolean => {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = grid[r][c];
      if (cell.value === 0 || cell.value !== cell.solutionValue) {
        return false;
      }
    }
  }
  return true;
};
