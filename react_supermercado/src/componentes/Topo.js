'use client';
import React, { useState, useEffect } from 'react';

// ADICIONEI: verHistorico, carregandoHistorico e usuarioLogado nas Props
function Topo({ totalItens, abrirCarrinho, verHistorico, carregandoHistorico, usuarioLogado }) {
  const [tempo, setTempo] = useState(86400); // 24 horas em segundos

  useEffect(() => {
    const timer = setInterval(() => {
      setTempo(prev => (prev > 0 ? prev - 1 : 86400));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatarTempo = (segundos) => {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    const format = (num) => String(num).padStart(2, '0');
    return `${format(h)}h ${format(m)}m ${format(s)}s`;
  };

  return (
    <header className="topo-container">
      <img src="slog.png" alt="Logo" className="imagem-topo" style={{ height: '100px' }} />

      <div className="topo-centro">
        <h1> Amigo do Bairro</h1>
        <div className="ofertas-timer">🔥 OFERTAS DA SEMANA: {formatarTempo(tempo)} 🔥</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        
        {/* Botão do Carrinho */}
        <button onClick={abrirCarrinho} className="botao-carrinho">
          🛒 <span className="badge">Carrinho</span>
          <span> ({totalItens})</span>
        </button>

        {/* Botão de Histórico - Só aparece se o usuário estiver logado */}
        {usuarioLogado && (
          <button className="btn-historico" onClick={verHistorico} style={{cursor: 'pointer'}}>
            {carregandoHistorico ? "⌛..." : "📋 Meus Pedidos"}
          </button>
        )}
      </div>
    </header>
  );
}

export default Topo;