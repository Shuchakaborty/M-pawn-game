/*easy-level:*/
document.addEventListener('DOMContentLoaded', () => {
  // 🎬 Welcome Screen
  const welcomeScreen = document.getElementById('welcomeScreen');
  const startBtn = document.getElementById('startBtn');

  startBtn.addEventListener('click', () => {
    welcomeScreen.classList.add('hidden');
    setTimeout(() => {
      welcomeScreen.style.display = "none";
    }, 800);
  });

  // 🧩 Game Logic
  const positions = {
    tl: ["center", "bl"],
    tr: ["center", "br"],
    bl: ["center", "tl", "br"],
    br: ["center", "tr", "bl"],
    center: ["tl", "tr", "bl", "br"]
  };

  let boardState = {};
  let turn = null;
  let selected = null;
  let gameOver = false;
  let mode = "2p";

  const turnText = document.getElementById('turnText');
  const message = document.getElementById('message');
  const resetBtn = document.getElementById('resetBtn');
  const tossBtn = document.getElementById('tossBtn');

  function initBoard() {
    boardState = { tl: null, tr: null, bl: null, br: null, center: null };
    boardState.tl = "red";
    boardState.tr = "red";
    boardState.bl = "green";
    boardState.br = "green";
    boardState.center = null;

    turn = null;
    selected = null;
    gameOver = false;
    message.textContent = "Click Toss to decide who starts!";
    turnText.textContent = "?";
    render();
  }

  function render() {
    Object.keys(boardState).forEach(id => {
      const el = document.getElementById(id);
      el.classList.remove('red', 'green', 'selected');
      if (boardState[id]) el.classList.add(boardState[id]);
      if (selected === id) el.classList.add('selected');
    });
    turnText.textContent = turn ? turn.charAt(0).toUpperCase() + turn.slice(1) : "?";
  }

  function showMessage(txt) {
    message.textContent = txt;
  }

  function toss() {
    if (turn) {
      showMessage("Toss already done!");
      return;
    }
    turn = Math.random() < 0.5 ? "red" : "green";
    showMessage(`Toss won by ${turn}. ${turn} starts!`);
    render();

    if (mode === "1p" && turn === "green") {
      setTimeout(aiMove, 800);
    }
  }

  function onPointClick(id) {
    if (gameOver || !turn) return;
    if (mode === "1p" && turn === "green") return;

    const occupant = boardState[id];

    if (!selected) {
      if (occupant === turn) {
        selected = id;
        render();
      }
      return;
    }

    if (selected === id) {
      selected = null;
      render();
      return;
    }

    if (!boardState[id] && positions[selected].includes(id)) {
      boardState[id] = turn;
      boardState[selected] = null;
      selected = null;
      render();

      if (checkWin()) return;

      turn = (turn === 'red') ? 'green' : 'red';
      render();

      if (mode === "1p" && turn === "green") {
        setTimeout(aiMove, 800);
      }
    } else {
      if (occupant === turn) {
        selected = id;
        render();
      } else {
        showMessage("Invalid move.");
        setTimeout(() => { if (!gameOver) showMessage(""); }, 700);
      }
    }
  }

  function playerPositions(color) {
    return Object.entries(boardState)
      .filter(([k, v]) => v === color)
      .map(([k]) => k);
  }

  function bothOnSameVerticalSide(color) {
    const pos = playerPositions(color);
    if (pos.length !== 2) return false;
    if (pos.includes('tl') && pos.includes('bl')) return true;
    if (pos.includes('tr') && pos.includes('br')) return true;
    return false;
  }

  function checkWin() {
    for (const player of ["red", "green"]) {
      const opponent = (player === "red") ? "green" : "red";
      const oppBothVertical = bothOnSameVerticalSide(opponent);
      const playerAtCenter = boardState.center === player;
      const playerPos = playerPositions(player);
      const otherPawn = playerPos.find(p => p !== "center");

      if (oppBothVertical && playerAtCenter) {
        if (boardState.tl === opponent && boardState.bl === opponent && otherPawn === "br") {
          setTimeout(() => declareWinner(player), 300);
          return true;
        }
        if (boardState.tr === opponent && boardState.br === opponent && otherPawn === "bl") {
          setTimeout(() => declareWinner(player), 300);
          return true;
        }
      }
    }
    return false;
  }

  function declareWinner(player) {
    showMessage(`${player} wins! 🎉`);
    gameOver = true;
    turnText.textContent = "-";
  }

  function aiMove() {
    if (gameOver) return;
    const aiColor = "green";
    const pawns = playerPositions(aiColor);
    let moves = [];
    pawns.forEach(pawn => {
      positions[pawn].forEach(dest => {
        if (!boardState[dest]) {
          moves.push({ from: pawn, to: dest });
        }
      });
    });

    if (moves.length === 0) return;
    const move = moves[Math.floor(Math.random() * moves.length)];
    boardState[move.to] = aiColor;
    boardState[move.from] = null;
    render();

    if (checkWin()) return;

    turn = "red";
    render();
  }

  document.querySelectorAll('.point').forEach(p => {
    p.addEventListener('click', () => onPointClick(p.dataset.id));
  });

  resetBtn.addEventListener('click', initBoard);
  tossBtn.addEventListener('click', toss);

  document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', e => {
      mode = e.target.value;
      showMessage(mode === "1p" ? "Mode: Single Player" : "Mode: Two Player");
      initBoard();
    });
  });

  initBoard();
});



/*taugh level*/
/* script.js — improved, robust game logic + tougher AI
   - Pure simulation helpers used so AI can evaluate moves without side-effects.
   - AI prioritizes: immediate win -> block opponent -> center -> mobility/spread.
*/

/*
document.addEventListener('DOMContentLoaded', () => {
  const positions = {
    tl: ["center", "bl"],
    tr: ["center", "br"],
    bl: ["center", "tl", "br"],
    br: ["center", "tr", "bl"],
    center: ["tl", "tr", "bl", "br"]
  };

  let boardState = {};       // e.g. { tl: "red", center: null, ... }
  let turn = null;           // "red" | "green" | null
  let selected = null;
  let gameOver = false;
  let mode = "2p";           // "1p" or "2p"

  const turnText = document.getElementById('turnText');
  const message = document.getElementById('message');
  const resetBtn = document.getElementById('resetBtn');
  const tossBtn = document.getElementById('tossBtn');

  // -------------------------
  // Initialization / Render
  // -------------------------
  function initBoard() {
    boardState = { tl: null, tr: null, bl: null, br: null, center: null };
    boardState.tl = "red";
    boardState.tr = "red";
    boardState.bl = "green";
    boardState.br = "green";
    boardState.center = null;

    turn = null;
    selected = null;
    gameOver = false;
    message.textContent = "Click Toss to decide who starts!";
    turnText.textContent = "?";

    // clear visual classes
    document.querySelectorAll('.point').forEach(p => {
      p.classList.remove('red','green','selected','winner');
    });

    render();
  }

  function render() {
    Object.keys(boardState).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('red', 'green', 'selected', 'winner');
      if (boardState[id]) el.classList.add(boardState[id]);
      if (selected === id) el.classList.add('selected');
    });
    turnText.textContent = turn ? (turn.charAt(0).toUpperCase() + turn.slice(1)) : "?";
  }

  function showMessage(txt) {
    message.textContent = txt || "";
  }

  // -------------------------
  // Pure helper functions (no side effects)
  // -------------------------
  function cloneState(state) {
    return { ...state };
  }

  function playerPositionsFromState(state, color) {
    return Object.entries(state).filter(([k,v]) => v === color).map(([k]) => k);
  }

  function bothOnSameVerticalSideInState(state, color) {
    const pos = playerPositionsFromState(state, color);
    if (pos.length !== 2) return false;
    if (pos.includes('tl') && pos.includes('bl')) return true;
    if (pos.includes('tr') && pos.includes('br')) return true;
    return false;
  }

  function isWinFor(state, player) {
    const opponent = player === "red" ? "green" : "red";
    const oppBothVertical = bothOnSameVerticalSideInState(state, opponent);
    const playerAtCenter = state.center === player;
    const playerPos = playerPositionsFromState(state, player);
    const otherPawn = playerPos.find(p => p !== "center");

    if (!oppBothVertical || !playerAtCenter) return false;

    if (state.tl === opponent && state.bl === opponent && otherPawn === "br") return true;
    if (state.tr === opponent && state.br === opponent && otherPawn === "bl") return true;

    return false;
  }

  function checkWin() {
    for (const player of ["red", "green"]) {
      if (isWinFor(boardState, player)) {
        setTimeout(() => declareWinner(player), 180);
        return true;
      }
    }
    return false;
  }

  function declareWinner(player) {
    playerPositionsFromState(boardState, player).forEach(pos => {
      const el = document.getElementById(pos);
      if (el) el.classList.add('winner');
    });

    showMessage(`${player.charAt(0).toUpperCase() + player.slice(1)} wins! 🎉`);
    gameOver = true;
    selected = null;
    turnText.textContent = "-";
  }

  function toss() {
    if (turn) {
      showMessage("Toss already done!");
      return;
    }
    turn = Math.random() < 0.5 ? "red" : "green";
    showMessage(`Toss won by ${turn}. ${turn} starts!`);
    render();

    if (mode === "1p" && turn === "green") {
      setTimeout(aiMove, 600);
    }
  }

  function onPointClick(id) {
    if (gameOver || !turn) return;
    if (mode === "1p" && turn === "green") return;

    const occupant = boardState[id];

    if (!selected) {
      if (occupant === turn) {
        selected = id;
        render();
      }
      return;
    }

    if (selected === id) {
      selected = null;
      render();
      return;
    }

    if (!boardState[id] && positions[selected].includes(id)) {
      boardState[id] = turn;
      boardState[selected] = null;
      selected = null;

      render();

      if (checkWin()) return;

      turn = (turn === "red") ? "green" : "red";
      render();

      if (mode === "1p" && turn === "green") {
        setTimeout(aiMove, 600);
      }
    } else {
      if (occupant === turn) {
        selected = id; render();
      } else {
        showMessage("Invalid move.");
        setTimeout(() => { if (!gameOver) showMessage(""); }, 700);
      }
    }
  }

  function evaluateState(state, aiColor, opponent) {
    if (isWinFor(state, aiColor)) return 1000;
    if (isWinFor(state, opponent)) return -1000;

    let score = 0;

    if (state.center === aiColor) score += 60;
    if (state.center === opponent) score -= 60;

    const aiMovesCount = countMovesForState(state, aiColor);
    const oppMovesCount = countMovesForState(state, opponent);
    score += (aiMovesCount - oppMovesCount) * 6;

    let oppCanWinNext = false;
    playerPositionsFromState(state, opponent).forEach(pawn => {
      positions[pawn].forEach(dest => {
        if (!state[dest]) {
          const s2 = cloneState(state);
          s2[dest] = opponent;
          s2[pawn] = null;
          if (isWinFor(s2, opponent)) oppCanWinNext = true;
        }
      });
    });
    if (oppCanWinNext) score -= 150;

    const aiPos = playerPositionsFromState(state, aiColor);
    if (aiPos.includes("tl") && aiPos.includes("br")) score += 12;
    if (aiPos.includes("tr") && aiPos.includes("bl")) score += 12;

    if (aiPos.includes("center")) score += 10;

    return score;
  }

  function countMovesForState(state, color) {
    let cnt = 0;
    playerPositionsFromState(state, color).forEach(pawn => {
      positions[pawn].forEach(dest => {
        if (!state[dest]) cnt++;
      });
    });
    return cnt;
  }

  function aiMove() {
    if (gameOver) return;
    const aiColor = "green";
    const opponent = "red";

    const pawns = playerPositionsFromState(boardState, aiColor);
    let candidates = [];
    pawns.forEach(pawn => {
      positions[pawn].forEach(dest => {
        if (!boardState[dest]) candidates.push({ from: pawn, to: dest });
      });
    });

    if (candidates.length === 0) return;

    for (let mv of candidates) {
      const s = cloneState(boardState);
      s[mv.to] = aiColor;
      s[mv.from] = null;
      if (isWinFor(s, aiColor)) {
        boardState[mv.to] = aiColor;
        boardState[mv.from] = null;
        render();
        checkWin();
        return;
      }
    }

    let bestScore = -Infinity;
    let bestMoves = [];
    for (let mv of candidates) {
      const s = cloneState(boardState);
      s[mv.to] = aiColor;
      s[mv.from] = null;
      const score = evaluateState(s, aiColor, opponent);

      let bonus = 0;
      if (mv.to === "center") bonus += 30;
      if ((mv.from === "tl" && mv.to === "br") || (mv.from === "tr" && mv.to === "bl")) bonus += 6;

      const finalScore = score + bonus;
      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestMoves = [mv];
      } else if (finalScore === bestScore) {
        bestMoves.push(mv);
      }
    }

    let chosen = bestMoves.find(m => m.to === "center") || bestMoves[Math.floor(Math.random() * bestMoves.length)];

    if (chosen) {
      boardState[chosen.to] = aiColor;
      boardState[chosen.from] = null;
    } else {
      const mv = candidates[Math.floor(Math.random() * candidates.length)];
      boardState[mv.to] = aiColor;
      boardState[mv.from] = null;
    }

    render();
    if (checkWin()) return;

    turn = "red";
    render();
  }

  document.querySelectorAll('.point').forEach(p => {
    p.addEventListener('click', () => onPointClick(p.dataset.id));
  });

  resetBtn.addEventListener('click', initBoard);
  tossBtn.addEventListener('click', toss);

  document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', e => {
      mode = e.target.value;
      showMessage(mode === "1p" ? "Mode: Single Player" : "Mode: Two Player");
      initBoard();
    });
  });

  initBoard();
});
*/
