import { prisma } from '../../utils/db';
import { z } from 'zod';

const scheduleSchema = z.object({
  title: z.string().min(1),
  dayOfWeek: z.number().min(1).max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().optional().nullable()
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const day = searchParams.get('day');
  const where = day ? { dayOfWeek: Number(day) } : {};
  const items = await prisma.schedule.findMany({ where, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] });
  return Response.json(items);
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = scheduleSchema.safeParse(json);
  if (!parsed.success) return new Response(JSON.stringify(parsed.error.flatten()), { status: 400 });
  const created = await prisma.schedule.create({ data: parsed.data });
  return Response.json(created, { status: 201 });
}
