// A flexible fallback template for any tally-style game not covered by a dedicated
// template (Catan, Ticket to Ride, Scrabble, Rummy, party-game point tallies, etc.):
// a plain calculator-style numpad instead of preset increment buttons, since arbitrary
// games need arbitrary point values, not just +1/+5/+10.
//
// Run with: bun run scripts/seed_generic_template.ts

import { upsertTemplate } from './lib/seed_helpers';

const SCRIPT = `
function appendDigit(ctx, digit) {
  if (!ctx.cell) return;
  var negative = ctx.cell.n1 < 0;
  var magnitude = Math.abs(ctx.cell.n1) * 10 + digit;
  ctx.cell.n1 = negative ? -magnitude : magnitude;
}

function onPress_digit0(ctx) { appendDigit(ctx, 0); }
function onPress_digit1(ctx) { appendDigit(ctx, 1); }
function onPress_digit2(ctx) { appendDigit(ctx, 2); }
function onPress_digit3(ctx) { appendDigit(ctx, 3); }
function onPress_digit4(ctx) { appendDigit(ctx, 4); }
function onPress_digit5(ctx) { appendDigit(ctx, 5); }
function onPress_digit6(ctx) { appendDigit(ctx, 6); }
function onPress_digit7(ctx) { appendDigit(ctx, 7); }
function onPress_digit8(ctx) { appendDigit(ctx, 8); }
function onPress_digit9(ctx) { appendDigit(ctx, 9); }

function onPress_backspace(ctx) {
  if (!ctx.cell) return;
  var negative = ctx.cell.n1 < 0;
  var magnitude = Math.floor(Math.abs(ctx.cell.n1) / 10);
  ctx.cell.n1 = negative ? -magnitude : magnitude;
}

function onPress_toggleSign(ctx) {
  if (ctx.cell) ctx.cell.n1 = -ctx.cell.n1;
}

function onPress_clear(ctx) {
  if (ctx.cell) ctx.cell.n1 = 0;
}

function onPress_down(ctx) {
  var row = ctx.focusRow === -1 ? 0 : ctx.focusRow + 1;
  var col = ctx.focusCol === -1 ? 0 : ctx.focusCol;
  ctx.changeFocus(row, col);
}

function onPress_up(ctx) {
  if (ctx.focusRow > 0) ctx.changeFocus(ctx.focusRow - 1, ctx.focusCol);
}

function onPress_left(ctx) {
  if (ctx.columnCount === 0) return;
  var col = ctx.focusCol === -1 ? 0 : (ctx.focusCol - 1 + ctx.columnCount) % ctx.columnCount;
  ctx.changeFocus(ctx.focusRow === -1 ? 0 : ctx.focusRow, col);
}

function onPress_right(ctx) {
  if (ctx.columnCount === 0) return;
  var col = ctx.focusCol === -1 ? 0 : (ctx.focusCol + 1) % ctx.columnCount;
  ctx.changeFocus(ctx.focusRow === -1 ? 0 : ctx.focusRow, col);
}

function computeScore(cell) { return cell.n1; }
function getCellLabel(cell) { return String(cell.n1); }
// score+plus is the actual total shown to a viewer (score = confirmed prior rounds,
// plus = the round still being entered) — check the real displayed total, not just the
// confirmed part, so the color doesn't lag a round behind what's on screen.
function getColor(player) { return (player.score + player.plus) < 0 ? 'var(--color-red)' : 'var(--color-green)'; }
function getText() { return ''; }
`;

// Calculator-style layout: digits in a familiar phone-keypad order, nav on the right
// edge, sign toggle/backspace/clear along the bottom.
const buttons = [
  { name: '1', icon: '1', handler_name: 'onPress_digit1', position: 0 },
  { name: '2', icon: '2', handler_name: 'onPress_digit2', position: 1 },
  { name: '3', icon: '3', handler_name: 'onPress_digit3', position: 2 },
  { name: 'Down', icon: 'arrow-down', handler_name: 'onPress_down', position: 3 },

  { name: '4', icon: '4', handler_name: 'onPress_digit4', position: 4 },
  { name: '5', icon: '5', handler_name: 'onPress_digit5', position: 5 },
  { name: '6', icon: '6', handler_name: 'onPress_digit6', position: 6 },
  { name: 'Up', icon: 'arrow-up', handler_name: 'onPress_up', position: 7 },

  { name: '7', icon: '7', handler_name: 'onPress_digit7', position: 8 },
  { name: '8', icon: '8', handler_name: 'onPress_digit8', position: 9 },
  { name: '9', icon: '9', handler_name: 'onPress_digit9', position: 10 },
  { name: 'Left', icon: 'arrow-left', handler_name: 'onPress_left', position: 11 },

  { name: 'Sign', icon: '±', handler_name: 'onPress_toggleSign', position: 12 },
  { name: '0', icon: '0', handler_name: 'onPress_digit0', position: 13 },
  { name: 'Backspace', icon: 'backspace', handler_name: 'onPress_backspace', position: 14 },
  { name: 'Right', icon: 'arrow-right', handler_name: 'onPress_right', position: 15 },

  { name: 'Clear', icon: '=0', handler_name: 'onPress_clear', position: 16, width: 4 }
];

async function main() {
  await upsertTemplate(
    'Point Tracker',
    'A plain numeric keypad for any tally-style game — type in whatever a round is worth, highest total wins.',
    SCRIPT,
    [{ name: 'primary', starts: true, columns: 4, rows: 5, buttons }]
  );
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
