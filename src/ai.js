import { CONSTANTS } from './constants.js';

export const AI = {
  getBestMove(board, difficulty) {
    const moves = board.getFreeMoves();
    if (moves.length === 0) return null;

    // 1. Провери кој потег носи поени
    if (difficulty !== 'easy') {
        const scorer = moves.find(m => {
            const tempBoard = board.clone();
            const res = tempBoard.makeMove(m.t, m.r, m.c, CONSTANTS.O);
            return res.points > 0;
        });
        if (scorer) return scorer;
    }

    // 2. Избегни давање поени (Hard)
    if (difficulty === 'hard') {
        // Филтрирај ги потезите кои НЕ му оставаат на противникот квадрат со 3 линии
        const safeMoves = moves.filter(m => {
            const tempBoard = board.clone();
            tempBoard.makeMove(m.t, m.r, m.c, CONSTANTS.O);
            // Сега провери дали X (противникот) може да земе поен во следниот потег
            const opponentMoves = tempBoard.getFreeMoves();
            const givesPoint = opponentMoves.some(om => {
                const b2 = tempBoard.clone();
                const res = b2.makeMove(om.t, om.r, om.c, CONSTANTS.X);
                return res.points > 0;
            });
            return !givesPoint;
        });

        if (safeMoves.length > 0) {
            return safeMoves[Math.floor(Math.random() * safeMoves.length)];
        }
    }

    // 3. Случаен избор
    return moves[Math.floor(Math.random() * moves.length)];
  }
};