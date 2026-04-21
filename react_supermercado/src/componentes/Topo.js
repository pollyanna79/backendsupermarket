'use client';
import React, { useState, useEffect } from 'react';


// ADICIONEI: verHistorico, carregandoHistorico e usuarioLogado nas Props
function Topo({ totalItens, abrirCarrinho, verHistorico, usuarioLogado, onLogout, verOfertas }) {
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
        <div className="balao-ofertas" style={{
          padding: '28px 24px 28px 18px',
          minHeight: '170px',
          minWidth: '340px',
          clipPath: 'polygon(8% 0%, 16% 10%, 24% 0%, 32% 10%, 40% 0%, 48% 10%, 56% 0%, 64% 10%, 72% 0%, 80% 10%, 88% 0%, 96% 10%, 90% 18%, 98% 30%, 90% 42%, 98% 54%, 90% 66%, 98% 78%, 90% 86%, 96% 92%, 88% 98%, 76% 90%, 64% 98%, 52% 90%, 40% 98%, 28% 90%, 16% 98%, 4% 92%, 10% 84%, 0% 74%, 10% 64%, 0% 54%, 10% 44%, 0% 34%, 10% 24%, 0% 14%)',
          boxShadow: '0 0 18px rgba(0,0,0,0.25)',
          justifyContent: 'center',
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'row',
          gap: '14px'
        }}>
          <img src="ofertas.png" alt="Ofertas" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span className="texto-pisca">🔥 OFERTAÇO 🔥</span>
            <span className="timer-destaque">{formatarTempo(tempo)}</span>
          </div>
        </div>
      </div>
        <div className="topo-direita">
        {/* NOVO: Botão de Ofertas */}
        <button className="btn-ofertas-topo" onClick={verOfertas}>
          🎁 Ofertas
        </button>
        
        {/* Botão do Carrinho */}
        <button onClick={abrirCarrinho} className="botao-carrinho">
          🛒 <span className="badge">Carrinho</span>
          <span> ({totalItens})</span>
        </button>
        <button 
  className="btn-historico" 
  onClick={verHistorico} 
  onDoubleClick={() => typeof onLogout === 'function' && onLogout()} // Aqui ele chama a função que vem do App.js
  style={{cursor: 'pointer'}}
>
  {usuarioLogado ? `Olá, 👤${usuarioLogado.nome} (Sair)` : "📋 Meus Pedidos"}
</button>

      </div>
    </header>
  );
}

export default Topo;