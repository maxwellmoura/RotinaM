'use client';
import { useEffect, useState } from 'react';

type Schedule = {
  id?: number;
  title: string;
  dayOfWeek: number; // 1=Seg, 5=Sex
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  notes?: string;
};

const dayNames: Record<number, string> = {1:'Segunda',2:'Terça',3:'Quarta',4:'Quinta',5:'Sexta'};

function todayYMDFortaleza() {
  const now = new Date();
  // força fuso -03:00 (America/Fortaleza)
  const tzNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Fortaleza' }));
  const y = tzNow.getFullYear();
  const m = String(tzNow.getMonth()+1).padStart(2,'0');
  const d = String(tzNow.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

export default function Home() {
  const [activeDay, setActiveDay] = useState<number>(1);
  const [items, setItems] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Schedule>({title:'', dayOfWeek:1, startTime:'08:00', endTime:'09:00', notes:''});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notifStatus, setNotifStatus] = useState<string>('');
  const [dateRef, setDateRef] = useState<string>(todayYMDFortaleza());
  const [completedSet, setCompletedSet] = useState<Set<number>>(new Set());

  const fetchItems = async (day?: number) => {
    setLoading(true);
    const res = await fetch('/api/schedules' + (day ? `?day=${day}` : ''));
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  // carrega tarefas do dia ativo
  useEffect(() => { fetchItems(activeDay); }, [activeDay]);

  // carrega logs (concluídas) para a data de referência
  const fetchLogsForDate = async (date: string, day?: number) => {
    const res = await fetch(`/api/logs?start=${date}&end=${date}`);
    const logs = await res.json();
    const set = new Set<number>();
    // marca como concluído apenas os logs completed=true do dia e que pertençam ao day
    logs.forEach((l: any) => {
      if (l.completed !== true) return;
      // a API de logs não filtra por dayOfWeek, então faremos no render cruzando com items
      set.add(l.scheduleId);
    });
    setCompletedSet(set);
  };

  useEffect(() => { fetchLogsForDate(dateRef, activeDay); }, [dateRef, activeDay, items.length]);

  const save = async () => {
    if (!form.title.trim()) return alert('Título é obrigatório');
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/schedules/${editingId}` : '/api/schedules';
    const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    if (!res.ok) {
      const t = await res.text();
      alert('Erro: ' + t);
    } else {
      setForm({...form, title:''});
      setEditingId(null);
      fetchItems(activeDay);
    }
  };

  const edit = (s: Schedule) => {
    setForm({...s});
    setEditingId(s.id!);
  };

  const removeItem = async (id?: number) => {
    if (!id) return;
    if (!confirm('Remover este horário?')) return;
    const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchItems(activeDay);
      // também limpa caso estivesse marcado
      const next = new Set(completedSet);
      next.delete(id!);
      setCompletedSet(next);
    }
  };

  const toggleCompleted = async (s: Schedule, checked: boolean) => {
    if (!s.id) return;
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ scheduleId: s.id, date: dateRef, completed: checked })
    });
    if (!res.ok) {
      const t = await res.text();
      alert('Erro ao marcar tarefa: ' + t);
      return;
    }
    const next = new Set(completedSet);
    if (checked) next.add(s.id); else next.delete(s.id);
    setCompletedSet(next);
  };

  // Notifications: register FCM token
  const registerNotifications = async () => {
    setNotifStatus('Solicitando permissão...');
    try {
      const { getToken, getMessaging, onMessage } = await import('firebase/messaging');
      const { app } = await import('./utils/firebaseClient'); // caminho relativo
      const messaging = getMessaging(app);
      const vapid = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY as string;
      const token = await getToken(messaging, { vapidKey: vapid });
      if (token) {
        await fetch('/api/tokens', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token }) });
        setNotifStatus('Notificações ativadas no seu dispositivo.');
      } else {
        setNotifStatus('Permissão negada ou indisponível.');
      }
      onMessage(messaging, (payload) => {
        console.log('Mensagem recebida em foreground: ', payload);
      });
    } catch (e:any) {
      console.error(e);
      setNotifStatus('Falha ao ativar notificações: ' + e.message);
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Nova Rotina</h1>
        <div className="flex gap-2">
          <a href="/relatorio" className="px-4 py-2 rounded-2xl bg-gray-800 text-white shadow">Relatório</a>
          <button onClick={registerNotifications} className="px-4 py-2 rounded-2xl bg-blue-600 text-white shadow">Ativar alertas no celular</button>
        </div>
      </header>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          {[1,2,3,4,5].map(d => (
            <button key={d} onClick={() => setActiveDay(d)}
              className={"px-3 py-2 rounded-2xl " + (activeDay===d ? "bg-blue-600 text-white" : "bg-white shadow")}>
              {dayNames[d]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Data:</label>
          <input type="date" className="border rounded-xl px-3 py-2"
                 value={dateRef} onChange={e=>setDateRef(e.target.value)} />
        </div>
      </div>

      <section className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="text-xl font-semibold mb-3">Horários de {dayNames[activeDay]}</h2>
            {loading ? <p>Carregando...</p> : (
              <ul className="divide-y">
                {items.map(s => (
                  <li key={s.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={s.id ? completedSet.has(s.id) : false}
                        onChange={e => toggleCompleted(s, e.target.checked)}
                        className="w-5 h-5"
                        title="Marcar como concluída na data selecionada"
                      />
                      <div>
                        <div className="font-medium">{s.startTime} - {s.endTime} • {s.title}</div>
                        {s.notes ? <div className="text-sm text-gray-500">{s.notes}</div> : null}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => edit(s)} className="px-3 py-1 rounded-xl bg-yellow-500 text-white">Editar</button>
                      <button onClick={() => removeItem(s.id)} className="px-3 py-1 rounded-xl bg-red-600 text-white">Remover</button>
                    </div>
                  </li>
                ))}
                {items.length===0 && <p className="text-gray-500">Sem horários para este dia.</p>}
              </ul>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <h2 className="text-xl font-semibold mb-3">{editingId ? 'Editar horário' : 'Novo horário'}</h2>
          <div className="space-y-3">
            <input className="w-full border rounded-xl px-3 py-2" placeholder="Título" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
            <select className="w-full border rounded-xl px-3 py-2" value={form.dayOfWeek} onChange={e=>setForm({...form, dayOfWeek: Number(e.target.value)})}>
              {[1,2,3,4,5].map(d => <option key={d} value={d}>{dayNames[d]}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input className="border rounded-xl px-3 py-2" type="time" value={form.startTime} onChange={e=>setForm({...form, startTime:e.target.value})} />
              <input className="border rounded-xl px-3 py-2" type="time" value={form.endTime} onChange={e=>setForm({...form, endTime:e.target.value})} />
            </div>
            <textarea className="w-full border rounded-xl px-3 py-2" placeholder="Notas (opcional)" value={form.notes||''} onChange={e=>setForm({...form, notes:e.target.value})} />
            <button onClick={save} className="w-full px-4 py-2 rounded-2xl bg-green-600 text-white">{editingId ? 'Salvar alterações' : 'Adicionar'}</button>
            {notifStatus && <p className="text-sm text-gray-600">{notifStatus}</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
