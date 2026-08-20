// Seeds the Flip7 template: two keyboards (primary = base score entry into n1 plus
// utility controls laid out like a phone numpad on the right, bonus = bonus-card entry
// into n2, reached via a keyboard-switch button instead of cramming every button onto
// one screen), and the score/cellLabel/color/text functions the edit and view pages
// call through the sandbox. Left/right nav skips locked players.
//
// Run with: bun run scripts/seed_flip7_template.ts

import { upsertTemplate } from './lib/seed_helpers';

const SCRIPT = `
function isLocked(cell) { return !!cell && cell.s.indexOf('L') !== -1; }

function addToField(ctx, field, amount) {
  if (ctx.cell && !isLocked(ctx.cell)) ctx.cell[field] += amount;
}

function onPress_add1(ctx) { addToField(ctx, 'n1', 1); }
function onPress_add2(ctx) { addToField(ctx, 'n1', 2); }
function onPress_add3(ctx) { addToField(ctx, 'n1', 3); }
function onPress_add4(ctx) { addToField(ctx, 'n1', 4); }
function onPress_add5(ctx) { addToField(ctx, 'n1', 5); }
function onPress_add6(ctx) { addToField(ctx, 'n1', 6); }
function onPress_add7(ctx) { addToField(ctx, 'n1', 7); }
function onPress_add8(ctx) { addToField(ctx, 'n1', 8); }
function onPress_add9(ctx) { addToField(ctx, 'n1', 9); }
function onPress_add10(ctx) { addToField(ctx, 'n1', 10); }
function onPress_add11(ctx) { addToField(ctx, 'n1', 11); }
function onPress_add12(ctx) { addToField(ctx, 'n1', 12); }

function onPress_bonus2(ctx) { addToField(ctx, 'n2', 2); }
function onPress_bonus4(ctx) { addToField(ctx, 'n2', 4); }
function onPress_bonus6(ctx) { addToField(ctx, 'n2', 6); }
function onPress_bonus8(ctx) { addToField(ctx, 'n2', 8); }
function onPress_bonus10(ctx) { addToField(ctx, 'n2', 10); }

function onPress_x2(ctx) { if (ctx.cell && !isLocked(ctx.cell)) ctx.toggleFlag(ctx.cell, '2'); }
function onPress_lock(ctx) { if (ctx.cell) ctx.setFlag(ctx.cell, 'L', true); }
function onPress_unlock(ctx) { if (ctx.cell) ctx.setFlag(ctx.cell, 'L', false); }

function onPress_clearAll(ctx) { if (ctx.cell && !isLocked(ctx.cell)) { ctx.cell.n1 = 0; ctx.cell.n2 = 0; } }
function onPress_clearBonus(ctx) { if (ctx.cell && !isLocked(ctx.cell)) ctx.cell.n2 = 0; }

function onPress_gotoBonus(ctx) { ctx.switchKeyboard('bonus'); }
function onPress_gotoPrimary(ctx) { ctx.switchKeyboard('primary'); }

function onPress_up(ctx) {
  if (ctx.focusRow > 0) ctx.changeFocus(ctx.focusRow - 1, ctx.focusCol);
}

function onPress_down(ctx) {
  var row = ctx.focusRow === -1 ? 0 : ctx.focusRow + 1;
  var col = ctx.focusCol === -1 ? 0 : ctx.focusCol;
  ctx.changeFocus(row, col);
}

// Left/right skip over locked players — their score is already finalized, so there's
// nothing to enter for them.
function onPress_left(ctx) {
  if (ctx.columnCount === 0) return;
  var row = ctx.focusRow === -1 ? 0 : ctx.focusRow;
  var col = ctx.focusCol === -1 ? 0 : ctx.focusCol;
  for (var i = 0; i < ctx.columnCount; i++) {
    col = (col - 1 + ctx.columnCount) % ctx.columnCount;
    var c = ctx.getCell(row, col);
    if (!isLocked(c)) { ctx.changeFocus(row, col); return; }
  }
}

function onPress_right(ctx) {
  if (ctx.columnCount === 0) return;
  var row = ctx.focusRow === -1 ? 0 : ctx.focusRow;
  var col = ctx.focusCol === -1 ? 0 : ctx.focusCol;
  for (var i = 0; i < ctx.columnCount; i++) {
    col = (col + 1) % ctx.columnCount;
    var c = ctx.getCell(row, col);
    if (!isLocked(c)) { ctx.changeFocus(row, col); return; }
  }
}

function computeScore(cell) {
  return cell.s.indexOf('2') !== -1 ? 2 * cell.n1 + cell.n2 : cell.n1 + cell.n2;
}

// What the editor's grid shows for a cell: locked cells collapse to their final score
// plus a lock emoji (nothing more to enter, no need to show the breakdown); active
// cells show the base score (with an x2 marker if doubling is active) and the bonus
// amount in parens if any bonus has been entered yet.
function getCellLabel(cell) {
  if (isLocked(cell)) return computeScore(cell) + ' \u{1F512}';
  var doubled = cell.s.indexOf('2') !== -1;
  var label = String(cell.n1) + (doubled ? ' x2' : '');
  if (cell.n2) label += ' (+' + cell.n2 + ')';
  return label;
}

function isPlayerLocked(player) {
  return !!player.focusCell && player.focusCell.s.indexOf('L') !== -1;
}

function getColor(player) {
  return isPlayerLocked(player) ? 'var(--color-yellow)' : 'var(--color-green)';
}

function getText(player) {
  return isPlayerLocked(player) ? '(inactive)' : '';
}
`;

async function main() {
  // Numpad layout: numbers 1-12 fill a 3-wide x 4-tall block on the left (thumb-
  // reachable like a phone keypad), utility controls on the right, left/right nav
  // landing in the bottom-right corner right where a numpad's last row would be.
  const primaryButtons = [
    { name: '1', icon: '1', handler_name: 'onPress_add1', position: 0 },
    { name: '2', icon: '2', handler_name: 'onPress_add2', position: 1 },
    { name: '3', icon: '3', handler_name: 'onPress_add3', position: 2 },
    { name: 'Down', icon: '⬇️', handler_name: 'onPress_down', position: 3 },
    { name: 'Unlock', icon: '🔑', handler_name: 'onPress_unlock', position: 4 },

    { name: '4', icon: '4', handler_name: 'onPress_add4', position: 5 },
    { name: '5', icon: '5', handler_name: 'onPress_add5', position: 6 },
    { name: '6', icon: '6', handler_name: 'onPress_add6', position: 7 },
    { name: 'Lock', icon: '🔒', handler_name: 'onPress_lock', position: 8 },
    { name: 'Clear', icon: '=0', handler_name: 'onPress_clearAll', position: 9 },

    { name: '7', icon: '7', handler_name: 'onPress_add7', position: 10 },
    { name: '8', icon: '8', handler_name: 'onPress_add8', position: 11 },
    { name: '9', icon: '9', handler_name: 'onPress_add9', position: 12 },
    { name: 'Bonus', icon: 'Bonus →', handler_name: 'onPress_gotoBonus', position: 13 },
    { name: 'x2', icon: 'x2', handler_name: 'onPress_x2', position: 14 },

    { name: '10', icon: '10', handler_name: 'onPress_add10', position: 15 },
    { name: '11', icon: '11', handler_name: 'onPress_add11', position: 16 },
    { name: '12', icon: '12', handler_name: 'onPress_add12', position: 17 },
    { name: 'Left', icon: '⬅️', handler_name: 'onPress_left', position: 18 },
    { name: 'Right', icon: '➡️', handler_name: 'onPress_right', position: 19 }
  ];

  // 4x2 grid with no leftover gap: "back" spans the two trailing cells of the second
  // row instead of leaving one empty — it's also the button you want easiest to hit
  // when you're done entering a bonus and heading back to the main keyboard.
  const bonusButtons = [
    { name: '+2', icon: '+2', handler_name: 'onPress_bonus2', position: 0, width: 1 },
    { name: '+4', icon: '+4', handler_name: 'onPress_bonus4', position: 1, width: 1 },
    { name: '+6', icon: '+6', handler_name: 'onPress_bonus6', position: 2, width: 1 },
    { name: '+8', icon: '+8', handler_name: 'onPress_bonus8', position: 3, width: 1 },
    { name: '+10', icon: '+10', handler_name: 'onPress_bonus10', position: 4, width: 1 },
    { name: 'Clear', icon: 'clear', handler_name: 'onPress_clearBonus', position: 5, width: 1 },
    { name: 'Back', icon: '← back', handler_name: 'onPress_gotoPrimary', position: 6, width: 2 }
  ];

  await upsertTemplate(
    'Flip7',
    'Classic Flip7 scoring: base score, bonus cards, x2, and locking a player once they stay.',
    SCRIPT,
    [
      { name: 'primary', starts: true, columns: 5, rows: 4, buttons: primaryButtons },
      { name: 'bonus', starts: false, columns: 4, rows: 2, buttons: bonusButtons }
    ]
  );
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
