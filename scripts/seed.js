// scripts/seed.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function isTimeHHMM(s) {
  return typeof s === 'string' && /^\d{2}:\d{2}$/.test(s);
}

function sanitizeItem(raw) {
  // Normaliza tipos básicos
  const item = {
    title: (raw.title ?? '').toString().trim(),
    dayOfWeek: Number(raw.dayOfWeek),
    startTime: typeof raw.startTime === 'string' ? raw.startTime.trim() : '',
    endTime: typeof raw.endTime === 'string' ? raw.endTime.trim() : '',
    notes: raw.notes ? String(raw.notes) : null,
  };

  // Validações
  if (!item.title || ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'].includes(item.title)) {
    return { ok: false, reason: 'Título inválido (parece cabeçalho ou está vazio).' };
  }
  if (!(item.dayOfWeek >= 1 && item.dayOfWeek <= 7)) {
    return { ok: false, reason: 'dayOfWeek fora do intervalo 1..7.' };
  }
  if (!isTimeHHMM(item.startTime)) {
    return { ok: false, reason: 'startTime inválido (esperado HH:MM).' };
  }
  if (!isTimeHHMM(item.endTime)) {
    // se não vier endTime, define = startTime (mínimo necessário pro schema atual)
    item.endTime = item.startTime;
  }
  return { ok: true, item };
}

async function main() {
  const file = path.join(process.cwd(), 'seed-schedules.json');
  if (!fs.existsSync(file)) {
    console.error('seed-schedules.json não encontrado na raiz do projeto.');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  let ok = 0, skipped = 0;

  for (const raw of data) {
    const res = sanitizeItem(raw);
    if (!res.ok) {
      skipped++;
      console.warn('Pulando item inválido:', res.reason, raw);
      continue;
    }
    await prisma.schedule.create({ data: res.item });
    ok++;
  }
  console.log(`Seed concluído: ${ok} inseridos, ${skipped} pulados.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());
