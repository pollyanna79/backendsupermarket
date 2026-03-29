import React, { useState, useEffect } from 'react';
import './App.css';
import Topo from "./componentes/Topo";
import Rodape from "./componentes/Rodape";

function App() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [etapa, setEtapa] = useState('vitrine'); 
  const [modoCadastro, setModoCadastro] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [pedidoFinalizado, setPedidoFinalizado] = useState(null);
  const [formData, setFormData] = useState({ nome: '', email: '', senha: '', telefone: '', cep: '', endereco: '', cpf: '' });

  useEffect(() => {
    fetch("http://localhost:3001/produtos").then(res => res.json()).then(d => setProdutos(d));
  }, []);

  const totalProd = carrinho.reduce((acc, i) => acc + (i.valor * i.qtd), 0);
  const valorFrete = formaPagamento === 'pix' ? 0 : 15.00;

 const handleAuth = async () => {
  const rota = modoCadastro ? 'cadastrar' : 'login';
  try {
    const response = await fetch(`http://localhost:3001/${rota}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    const dados = await response.json();

    if (response.ok) {
      console.log("Usuário logado com sucesso. ID:", dados.id);
      setUsuario(dados); // Aqui guardamos o ID 2 ou 4 que veio do banco
      setEtapa('checkout');
    } else {
      alert(dados.message || "Erro na autenticação");
    }
  } catch (err) {
    console.error("Erro:", err);
  }
};
const finalizar = async () => {
  // 1. Verificação de segurança
  if (!usuario || !usuario.id) {
    return alert("Usuário não identificado. Por favor, faça login novamente.");
  }

  const novoNumeroPedido = Math.floor(Math.random() * 100000);

  try {
    // Percorremos cada item do carrinho
    for (const item of carrinho) {
      alert(`Enviando Produto: ${item.produto} | ID: ${item.id}`);
      // DECLARAÇÃO DA VARIÁVEL: Ela deve estar AQUI DENTRO
      
  const corpoVenda = {
  id_pedido: novoNumeroPedido,
  id_cliente: usuario.id,
  produto: item.produto,
  quantidade: item.qtd || 1,
  valor: item.valor,
  id_produto: item.id // <--- TEM QUE SER ESSE NOME PARA O SERVER.JS LER
};
      console.log("Enviando item para o banco:", corpoVenda);

      const response = await fetch("http://localhost:3001/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpoVenda) // Agora o corpoVenda existe aqui!
      });
      if (!response.ok) throw new Error("Erro no servidor");

      
      }
      setEtapa('sucesso');
    setCarrinho([]);
  } catch (err) {
    alert("Erro: " + err.message);
    }
  };
  
  return (
    <div className="App">
      <Topo totalItens={carrinho.length} abrirCarrinho={() => setEtapa('carrinho')} temPedido={!!pedidoFinalizado} />
      
      <main className="conteudo-principal">
        {etapa === 'vitrine' && (
          <div className="grid-produtos">
            {produtos.map(p => (
              <div key={p.id} className="card">
                <img src={p.imagem_url} alt={p.produto} />
                <h3>{p.produto}</h3>
                <p>R$ {parseFloat(p.valor).toFixed(2)}</p>
                <button onClick={() => { setCarrinho([...carrinho, {...p, qtd:1, id: p.id }]); setEtapa('carrinho'); }}>Comprar</button>
              </div>
            ))}
          </div>
        )}

        {etapa === 'carrinho' && (
          <div className="container-venda">
            <h2>🛒 Carrinho</h2>
            {carrinho.map((i, idx) => (
              <div key={idx} className="item-lista"><span>{i.produto}</span><span>R$ {i.valor}</span></div>
            ))}
            <h3>Total: R$ {totalProd.toFixed(2)}</h3>
            <button className="btn-p" onClick={() => setEtapa('login')}>Finalizar</button>
          </div>
        )}

        {etapa === 'login' && (
          <div className="container-venda">
            <h2>{modoCadastro ? "📝 Cadastro" : "🔐 Login"}</h2>
            <input className="in-v" placeholder="E-mail" onChange={e => setFormData({...formData, email: e.target.value})} />
            <input className="in-v" type="password" placeholder="Senha" onChange={e => setFormData({...formData, senha: e.target.value})} />
            {modoCadastro && <input className="in-v" placeholder="Nome" onChange={e => setFormData({...formData, nome: e.target.value})} />}
            <button className="btn-p" onClick={handleAuth}>{modoCadastro ? "Cadastrar" : "Entrar"}</button>
            <p className="link-troca" onClick={() => setModoCadastro(!modoCadastro)}>Trocar Login/Cadastro</p>
          </div>
        )}

        {etapa === 'checkout' && (
          <div className="container-venda">
            <h2>📍 Entrega para {usuario?.nome}</h2>
            <select className="in-v" onChange={e => setFormaPagamento(e.target.value)}>
              <option value="">Pagamento...</option>
              <option value="pix">Pix</option>
              <option value="cartao">Cartão</option>
            </select>
            <h3>Total: R$ {(totalProd + valorFrete).toFixed(2)}</h3>
            <button className="btn-p" onClick={finalizar}>Confirmar Pedido</button>
          </div>
        )}

        {etapa === 'sucesso' && (
          <div className="alerta-s">
            <h2>✅ Pedido #{pedidoFinalizado?.numero} Confirmado!</h2>
            <button className="btn-p" onClick={() => setEtapa('vitrine')}>Voltar</button>
          </div>
        )}
      </main>
      <Rodape />
    </div>
  );
}

export default App;