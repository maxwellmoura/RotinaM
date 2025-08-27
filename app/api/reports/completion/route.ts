// app/api/reports/completion/route.ts
import { prisma } from '@/app/utils/db';

function toFortalezaDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00-03:00`);
}
function formatYMD(d: Date) {
  return d.toISOString().slice(0,10);
}
function getDow1to7(d: Date) {
  // JS: 0=domingo..6=sábado  ->  1=segunda..7=domingo
  const js = d.getDay();
  return js === 0 ? 7 : js;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  if (!start || !end) return new Response('start e end obrigatórios (YYYY-MM-DD)', { status: 400 });

  const startDate = toFortalezaDate(start);
  const endDate = toFortalezaDate(end);

  // carrega todas as tarefas (schedules) uma vez
  const schedules = await prisma.schedule.findMany();

  // carrega logs no intervalo
  const logs = await prisma.taskLog.findMany({
    where: {
      date: {
        gte: startDate,
        lte: new Date(new Date(endDate).setDate(endDate.getDate() + 1)), // inclui end
      },
      completed: true,
    },
  });

  // indexa logs por data (YYYY-MM-DD) -> Set(scheduleId)
  const logsByDate = new Map<string, Set<number>>();
  for (const l of logs) {
    const ymd = formatYMD(l.date);
    if (!logsByDate.has(ymd)) logsByDate.set(ymd, new Set());
    logsByDate.get(ymd)!.add(l.scheduleId);
  }

  // percorre cada dia do intervalo e separa concluídas/pendentes
  const result: Array<{
    date: string,
    completed: any[],
    pending: any[]
  }> = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const ymd = formatYMD(d);
    const dow = getDow1to7(d);

    const daySchedules = schedules.filter(s => s.dayOfWeek === dow);
    const doneSet = logsByDate.get(ymd) || new Set<number>();

    const completed = daySchedules.filter(s => doneSet.has(s.id));
    const pending = daySchedules.filter(s => !doneSet.has(s.id));

    result.push({ date: ymd, completed, pending });
  }

  return Response.json(result);
}
