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
