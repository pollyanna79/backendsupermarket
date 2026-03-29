'use client';
import React, { useState, useEffect } from 'react';

function Topo({ totalItens, abrirCarrinho }) {
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
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <header className="topo-container">
      <img src="https://cdn-icons-png.flaticon.com/512/3081/3081986.png" alt="Casal Compras" className="imagem-topo" />
      
      <div style={{textAlign: 'center'}}>
        <h1> Amigo do Bairro</h1>
        <div className="ofertas-timer">🔥 OFERTAS DA SEMANA: {formatarTempo(tempo)} 🔥</div>
      </div>

      <button onClick={abrirCarrinho} style={{fontSize: '1.5rem', cursor: 'pointer'}}>
        🛒 <span>{totalItens}</span>
      </button>
    </header>
  );
}
export default Topo;