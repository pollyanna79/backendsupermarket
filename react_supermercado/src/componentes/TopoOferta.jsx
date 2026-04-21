
'use client';
import React, { useState, useEffect } from 'react';

// 1. Verifique se onLogout está EXATAMENTE assim dentro das chaves
function Topo({ totalItens, abrirCarrinho, verHistorico, usuarioLogado, onLogout,verOfertas }) {
  const [tempo, setTempo] = useState(86400);

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
   <header className="topo-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', minHeight: '160px' }}>
      <div className="balao-container" style={{ flex: '0 0 auto', position: 'relative', zIndex: 10 }}>
        <div className="balao-ofertas" style={{
            padding: '15px 20px',
            minHeight: '160px',
            minWidth: '180px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            clipPath: 'polygon(8% 0%, 16% 12%, 24% 0%, 32% 12%, 40% 0%, 48% 12%, 56% 0%, 64% 12%, 72% 0%, 80% 12%, 88% 0%, 96% 10%, 90% 18%, 98% 30%, 90% 42%, 98% 54%, 90% 66%, 98% 78%, 90% 86%, 96% 92%, 88% 98%, 76% 90%, 64% 98%, 52% 90%, 40% 98%, 28% 90%, 16% 98%, 4% 92%, 10% 84%, 0% 74%, 10% 64%, 0% 54%, 10% 44%, 0% 34%, 10% 24%, 0% 14%)',
            boxShadow: '0 0 22px rgba(0,0,0,0.30)'
          }}>
            <img src="ofertas.png" alt="Ofertas" style={{ width: '150px', height: '150px', objectFit: 'contain' }} />
          </div>
      </div>

      <div className="logo-container" style={{ flex: '1', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img src="slog.png" alt="Logo" className="imagem-topo" style={{ height: '70px' }} />
        <h1 style={{ fontSize: '1.55rem', margin: 0 }}>Amigo do Bairro</h1>
      </div>

      <div className="botoes-container" style={{ flex: '0 0 auto', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* BOTÃO DE OFERTAS - Agora fixo antes do carrinho */}
        <button 
          className="btn-ofertas-topo" 
          onClick={verOfertas}
          style={{ backgroundColor: '#ffc107', color: '#000', fontWeight: 'bold', padding: '8px 12px', borderRadius: '5px', border: 'none', cursor: 'pointer' }}
        >
          🎁 Ofertas
        </button>

        <button onClick={abrirCarrinho} className="botao-carrinho">
          🛒 Carrinho <span className="badge">{totalItens}</span>
        </button>

        {/* BOTÃO PEDIDOS - Agora fixo com o nome "Pedidos" */}
        <button 
          className="btn-historico" 
          onClick={verHistorico}
          style={{ cursor: 'pointer', padding: '8px 12px' }}
        >
          📋 Pedidos
        </button>

        {/* Mostra o nome do usuário apenas como um texto pequeno se estiver logado, com opção de sair */}
        {usuarioLogado && (
          <span className="link-sair" onClick={onLogout}>
    Sair ({usuarioLogado.nome.split(' ')[0]})
  </span>
        )}
      </div>
    </header>
  );
}

export default Topo;