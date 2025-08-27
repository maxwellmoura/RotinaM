# Nova Rotina — Sistema (Next.js + Prisma + Firebase)

Este projeto transforma sua planilha em um sistema web com:
- CRUD de horários (adicionar, editar, remover)
- Visualização por dia da semana (Seg a Sex)
- Alertas no celular via **push notifications** (Firebase Cloud Messaging)
- Importação dos dados extraídos da sua planilha

## 1) Requisitos
- Node 18+
- **Firebase** (projeto e Cloud Messaging habilitado)
- Opcional: Vercel (para hospedagem + CRON)

## 2) Primeira execução (local)
```bash
cp .env.example .env
# edite .env com suas chaves do Firebase e VAPID

npm install
npm run db:push            # cria o banco SQLite
# copie o arquivo seed-schedules.json (gerado por mim) para a raiz do projeto
npm run seed               # importa os horários
npm run dev
```

Acesse http://localhost:3000

## 3) Push Notifications (celular)
1. Crie um projeto no Firebase e ative o **Cloud Messaging**.
2. Gere uma **chave VAPID** em *Configurações do projeto → Cloud Messaging*.
3. Em **Credenciais da conta de serviço**, crie uma **Service Account** e baixe o JSON.
4. Converta o JSON para Base64 e cole em `FIREBASE_SERVICE_ACCOUNT_B64`:
   ```bash
   base64 -w0 serviceAccount.json
   ```
5. Preencha as variáveis `NEXT_PUBLIC_FIREBASE_*` e `NEXT_PUBLIC_FIREBASE_VAPID_KEY` no `.env`.
6. Ao abrir o app, clique em **“Ativar alertas no celular”**. Aceite a permissão.

## 4) Alertas automáticos (10 min antes)
- Endpoint: `GET /api/notify-due` verifica itens que começam nos próximos 10 minutos (fuso **America/Fortaleza**).
- Agende uma CRON (Vercel → Settings → Cron Jobs) para chamar este endpoint a cada 5 minutos.

## 5) Estrutura
- `app/page.tsx`: UI com abas por dia + formulário
- `app/api/schedules`: API REST (GET/POST/PUT/DELETE)
- `app/api/tokens`: salva tokens FCM
- `app/api/notify-due`: envia push
- `prisma/schema.prisma`: modelos `Schedule` e `DeviceToken`
- `public/firebase-messaging-sw.js`: service worker para receber notificações

## 6) Importante
- Este projeto usa **SQLite** por padrão. Em produção, troque `datasource db` para `postgresql` e ajuste `DATABASE_URL`.
- Os horários foram extraídos automaticamente da sua planilha `NOVA ROTINA.xlsx` e salvos em `seed-schedules.json` (incluso separadamente).

Bom uso! 🚀
