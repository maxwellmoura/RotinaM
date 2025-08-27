import { prisma } from '@/app/utils/db';
import { z } from 'zod';

const scheduleSchema = z.object({
  title: z.string().min(1),
  dayOfWeek: z.number().min(1).max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().optional().nullable()
});

export async function PUT(req: Request, { params }: { params: { id: string }}) {
  const id = Number(params.id);
  const json = await req.json();
  const parsed = scheduleSchema.safeParse(json);
  if (!parsed.success) return new Response(JSON.stringify(parsed.error.flatten()), { status: 400 });
  const updated = await prisma.schedule.update({ where: { id }, data: parsed.data });
  return Response.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string }}) {
  const id = Number(params.id);
  await prisma.schedule.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
