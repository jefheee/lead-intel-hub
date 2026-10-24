import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-bold font-mono">404 - Página Não Encontrada</h2>
      <p className="text-xs text-slate-400 mt-2">O recurso solicitado não existe.</p>
      <Link
        href="/"
        className="mt-4 bg-sky-600 hover:bg-sky-500 text-white text-xs px-4 py-2 rounded-lg transition"
      >
        Retornar ao Painel
      </Link>
    </div>
  );
}
