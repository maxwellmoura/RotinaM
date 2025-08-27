// app/api/logs/route.ts
import { prisma } from '@/app/utils/db';

function toFortalezaDate(dateStr: string) {
  // Converte "YYYY-MM-DD" para Date em 00:00:00 no fuso -03:00
  return new Date(`${dateStr}T00:00:00-03:00`);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start) return new Response('start obrigatório (YYYY-MM-DD)', { status: 400 });
  const startDate = toFortalezaDate(start);

  let where: any = { date: { gte: startDate } };
  if (end) {
    const endDate = toFortalezaDate(end);
    // inclui o fim (end) adicionando +1 dia
    const endPlus = new Date(endDate);
    endPlus.setDate(endPlus.getDate() + 1);
    where.date.lte = endPlus;
  }

  const logs = await prisma.taskLog.findMany({ where });
  return Response.json(logs);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { scheduleId, date, completed } = body || {};
  if (!scheduleId || !date) return new Response('scheduleId e date são obrigatórios', { status: 400 });

  const when = toFortalezaDate(date);
  const data = {
    scheduleId: Number(scheduleId),
    date: when,
    completed: completed !== false, // default true
    completedAt: new Date(),
  };

  // upsert pelo par único (scheduleId, date)
  const log = await prisma.taskLog.upsert({
    where: { scheduleId_date: { scheduleId: data.scheduleId, date: data.date } },
    update: { completed: data.completed, completedAt: data.completedAt },
    create: data,
  });

  return Response.json(log);
}
