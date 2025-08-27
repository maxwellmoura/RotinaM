'use client';
import { useEffect, useState } from 'react';

type Schedule = {
  id: number;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  notes?: string | null;
};
type ReportDay = {
  date: string;
  completed: Schedule[];
  pending: Schedule[];
};

function todayYMDFortaleza() {
  const now = new Date();
  const tzNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Fortaleza' }));
  const y = tzNow.getFullYear();
  const m = String(tzNow.getMonth()+1).padStart(2,'0');
  const d = String(tzNow.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function ymdDaysAgo(n: number) {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Fortaleza' }));
  now.setDate(now.getDate() - n);
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

export default function Relatorio() {
  const [start, setStart] = useState(ymdDaysAgo(6));
  const [end, setEnd] = useState(todayYMDFortaleza());
  const [data, setData] = useState<ReportDay[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/reports/completion?start=${start}&end=${end}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatório de Tarefas</h1>
        <a href="/" className="px-4 py-2 rounded-2xl bg-gray-200">Voltar</a>
      </header>

      <div className="bg-white rounded-2xl shadow p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm text-gray-600">Início</label>
          <input type="date" className="border rounded-xl px-3 py-2" value={start} onChange={e=>setStart(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Fim</label>
          <input type="date" className="border rounded-xl px-3 py-2" value={end} onChange={e=>setEnd(e.target.value)} />
        </div>
        <button onClick={load} className="px-4 py-2 rounded-2xl bg-blue-600 text-white shadow">Gerar relatório</button>
      </div>

      {loading && <p>Carregando...</p>}
      {!loading && data && data.length === 0 && <p>Nenhum dado no período.</p>}

      {!loading && data && data.length > 0 && (
        <div className="space-y-6">
          {data.map(day => (
            <div key={day.date} className="bg-white rounded-2xl shadow p-4">
              <h2 className="text-lg font-semibold mb-2">{day.date}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Concluídas</h3>
                  {day.completed.length === 0 ? <p className="text-gray-500">—</p> : (
                    <ul className="list-disc pl-5 space-y-1">
                      {day.completed.map(s => (
                        <li key={s.id}>{s.startTime} - {s.endTime} • {s.title}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h3 className="font-medium mb-2">Pendentes</h3>
                  {day.pending.length === 0 ? <p className="text-gray-500">—</p> : (
                    <ul className="list-disc pl-5 space-y-1">
                      {day.pending.map(s => (
                        <li key={s.id}>{s.startTime} - {s.endTime} • {s.title}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
