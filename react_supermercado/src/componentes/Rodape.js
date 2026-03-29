import React from 'react';

function Rodape() {
  const anoAtual = new Date().getFullYear();

  return (
    <footer className="rodape-container">
      <div className="rodape-content">
        <p>© {anoAtual} <strong>Loja Amigo do Bairro</strong> - Pollyanna Sistemas</p>
        <div className="rodape-links">
          <span>📍 Mauá, SP</span> | 
          <span> 💳 Aceitamos todos os cartões</span>
        </div>
        <small style={{display: 'block', marginTop: '10px', color: '#aaa'}}>
          Desenvolvido com React, Node e MySQL
        </small>
      </div>
    </footer>
  );
}

export default Rodape;