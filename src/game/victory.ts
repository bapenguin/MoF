// End-of-scenario cards. The original only had one (win2.bmp, "Scenario 1
// Complete") and showed it after every scenario. The Wilderness keeps that
// original; the others are drawn in the same style: wooden card, green serif
// title, the final battlefield with a few casualties, and a story paragraph.
// Like the original card, the story leads into the next scenario's intro.

import { getSheet } from '../engine/sprites';
import { FairyClass, levelOrder, scenarioList, type ScenarioDef } from './data';

const W = 400;
const H = 400;

// The original game never had an ending. Written for the port; edit freely.
const FINAL_STORY =
  'The Fairy Kingdom lies in smoking ruins. Deep in the castle you find Boof, tied up but unharmed, ' +
  'and the two of you walk home across a sea of fairy carcasses. Peace at last... until that buzzing starts again.';

const cache = new Map<string, HTMLCanvasElement>();

export function drawVictoryCard(ctx: CanvasRenderingContext2D, scenario: ScenarioDef, x: number, y: number): void {
  if (scenario.id === 'wild') {
    getSheet('win2').draw(ctx, x, y);
    return;
  }
  let card = cache.get(scenario.id);
  if (!card) {
    card = buildCard(scenario);
    cache.set(scenario.id, card);
  }
  ctx.drawImage(card, x, y);
}

function buildCard(scenario: ScenarioDef): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d')!;
  const index = scenarioList.findIndex((s) => s.id === scenario.id);
  const next = scenarioList[index + 1];
  const level = levelOrder(scenario).at(-1)!;

  // Wood, darkened to the original card's tone, with a bevelled edge.
  c.drawImage(getSheet('wood', 'ui').image, 120, 200, W, H, 0, 0, W, H);
  c.fillStyle = 'rgba(45,20,0,0.38)';
  c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(0,0,0,0.6)';
  c.lineWidth = 4;
  c.strokeRect(2, 2, W - 4, H - 4);

  // Title
  c.font = 'bold 34px Garamond, Georgia, "Times New Roman", serif';
  c.textBaseline = 'top';
  c.textAlign = 'center';
  c.fillStyle = '#000';
  c.fillText(`Scenario ${index + 1} Complete`, W / 2 + 2, 6);
  c.fillStyle = 'rgb(30,170,40)';
  c.fillText(`Scenario ${index + 1} Complete`, W / 2, 4);

  // The final battlefield, with a drop shadow like the original's photo.
  const px = 80;
  const py = 46;
  const pw = 240;
  const ph = 180;
  c.save();
  c.shadowColor = 'rgba(0,0,0,0.75)';
  c.shadowBlur = 10;
  c.shadowOffsetX = 6;
  c.shadowOffsetY = 6;
  c.drawImage(getSheet(level.bg, 'bg').image, px, py, pw, ph);
  c.restore();

  // A few casualties from that level, lying where they fell.
  c.save();
  c.beginPath();
  c.rect(px, py, pw, ph);
  c.clip();
  const victims = level.spawns
    .map((s) => scenario.fairies[s.type])
    .filter((f) => f && f.class === FairyClass.Fairy);
  for (let i = 0; i < 4 && victims.length; i++) {
    const f = victims[i % victims.length];
    const sheet = getSheet(f.deathSprite);
    const scale = 0.55;
    const w = sheet.frameW * scale;
    const h = sheet.frameH * scale;
    const fx = px + 18 + i * ((pw - 36 - w) / 3);
    // Death animations disintegrate; an early frame is bloody but still recognisable.
    const frame = Math.floor(sheet.framesX * 0.4);
    c.drawImage(sheet.image, frame * sheet.frameW, 0, sheet.frameW, sheet.frameH, fx, py + ph - h - 6 - (i % 2) * 14, w, h);
  }
  c.restore();

  // Story: the next scenario's intro, or the ending.
  wrapText(c, next ? next.description : FINAL_STORY, 24, 244, W - 48, 21);
  return canvas;
}

function wrapText(c: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number): void {
  c.font = 'bold 17px Garamond, Georgia, "Times New Roman", serif';
  c.textAlign = 'left';
  c.fillStyle = 'rgb(40,200,40)';
  let line = '';
  for (const word of text.split(' ')) {
    const attempt = line ? `${line} ${word}` : word;
    if (c.measureText(attempt).width > width && line) {
      c.fillText(line, x, y);
      y += lineHeight;
      line = word;
    } else line = attempt;
  }
  if (line) c.fillText(line, x, y);
}
