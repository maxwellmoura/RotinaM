import { prisma } from '@/app/utils/db';
import { sendPushToAll } from '@/app/utils/firebaseAdmin';

export async function GET() {
  const now = new Date();
  // Ajuste para fuso local se necessário (America/Fortaleza)
  const tz = 'America/Fortaleza';
  const fmt = new Intl.DateTimeFormat('pt-BR', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
  const parts = fmt.formatToParts(now);
  const hh = parts.find(p => p.type==='hour')?.value || '00';
  const mm = parts.find(p => p.type==='minute')?.value || '00';
  const dow = (((now.getUTCDay() + 6) % 7) + 1); // 1..7, segunda=1, domingo=7

  // Janela: próximos 10 minutos
  const current = `${hh}:${mm}`;
  function addMinutes(time: string, minutes: number) {
    const [H, M] = time.split(':').map(Number);
    const d = new Date(`1970-01-01T${time}:00`);
    d.setMinutes(d.getMinutes() + minutes);
    return d.toISOString().slice(11,16);
  }
  const target = addMinutes(current, 10);

  const items = await prisma.schedule.findMany({
    where: { dayOfWeek: { in: [dow] } }
  });

  const due = items.filter(s => s.startTime >= current && s.startTime <= target);
  if (due.length) {
    const msgTitle = 'Lembrete de rotina';
    const body = due.map(d => `${d.startTime} • ${d.title}`).join(' | ');
    try {
      const res = await sendPushToAll(msgTitle, body);
      return Response.json({ sent: res, due: due.length });
    } catch (e:any) {
      return new Response('Erro ao enviar push: ' + e.message, { status: 500 });
    }
  }
  return Response.json({ sent: 0, due: 0 });
}
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;