"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background">
      <div className="text-7xl mb-6">📡</div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Sem conexão</h1>
      <p className="text-gray-500 text-sm max-w-xs">
        Você está offline. Verifique sua conexão com a internet e tente novamente.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 px-6 py-3 bg-primary text-white rounded-3xl font-bold shadow-btn-primary active:translate-y-[3px] active:shadow-none"
      >
        Tentar novamente
      </button>
    </div>
  );
}
