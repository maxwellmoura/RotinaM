import { prisma } from '@/app/utils/db';

export async function POST(req: Request) {
  const { token } = await req.json();
  if (!token) return new Response('Token obrigatório', { status: 400 });
  try {
    await prisma.deviceToken.upsert({
      where: { token },
      update: {},
      create: { token },
    });
    return new Response('ok');
  } catch (e:any) {
    return new Response('Erro ao salvar token', { status: 500 });
  }
}
