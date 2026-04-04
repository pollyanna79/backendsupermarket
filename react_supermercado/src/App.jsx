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
  // --- FUNÇÕES DO CARRINHO ---

  const adicionarAoCarrinho = (p) => {
    const itemExiste = carrinho.find(item => item.id === p.id);

    if (itemExiste) {
      // Se já existe, aumenta a quantidade
      setCarrinho(carrinho.map(item => 
        item.id === p.id ? { ...item, qtd: item.qtd + 1 } : item
      ));
    } else {
      // Se é novo, adiciona com qtd 1
      setCarrinho([...carrinho, { ...p, qtd: 1 }]);
    }
    // Removido o setEtapa('carrinho') para permitir continuar comprando
  };

  const alterarQuantidade = (id, delta) => {
    setCarrinho(carrinho.map(item => {
      if (item.id === id) {
        const novaQtd = item.qtd + delta;
        return novaQtd > 0 ? { ...item, qtd: novaQtd } : item;
      }
      return item;
    }).filter(item => item.qtd > 0)); // Opcional: remove se chegar a zero
  };

  const removerDoCarrinho = (id) => {
    setCarrinho(carrinho.filter(item => item.id !== id));
  };

  const totalProd = carrinho.reduce((acc, i) => acc + (i.valor * i.qtd), 0);
  const valorFrete = formaPagamento === 'pix' ? 0 : 15.00;
// --- MÉTODOS DE AUTENTICAÇÃO E FINALIZAÇÃO ---
const handleAuth = async () => {
  const rota = modoCadastro ? 'cadastrar' : 'login';
  console.log(`Tentando ${rota} com:`, formData); // VEJA SE ISSO APARECE NO F12

  try {
    const response = await fetch(`http://localhost:3001/${rota}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    const dados = await response.json();

if (response.ok) {
      console.log("Sucesso! Dados recebidos:", dados);
      
      // IMPORTANTE: Verifique se o seu Back-end retorna 'id' ou 'id_cliente'
      setUsuario(dados); 
      
      // MUDA PARA A TELA DE PAGAMENTO
      setEtapa('checkout'); 
    } else {
      alert(dados.message || "Erro na autenticação");
    }
  } catch (err) {
    console.error("Erro na conexão com o servidor:", err);
    alert("Servidor desligado ou erro de rede.");
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
  id_produto: item.id // <--- TEM QUE TER ESSE NOME PARA O SERVER.JS LER
};
      console.log("Enviando item para o banco:", corpoVenda);

      const response = await fetch("http://localhost:3001/venda_cliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpoVenda) // corpoVenda existe aqui!
      });
      if (!response.ok){
        const textoErro = await response.text(); // Lê como texto, não JSON
  console.error("Erro bruto do servidor:", textoErro);
  throw new Error(`Servidor respondeu com erro ${response.status}`);

      } 
      
      }
      setPedidoFinalizado({ numero: novoNumeroPedido });
      setEtapa('sucesso');
    setCarrinho([]);
  } catch (err) {
    alert("❌ Falha no Pedido: " + err.message);
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
{carrinho.length === 0 ? <p>O carrinho está vazio.</p> : (
              <>
                {carrinho.map((i) => (
                  <div key={i.id} className="item-carrinho-detalhado">
                    <img src={i.imagem_url} alt={i.produto} className="img-mini" />
                    <div className="info-item">
                      <span className="nome-p">{i.produto}</span>
                      <span className="preco-p">R$ {parseFloat(i.valor).toFixed(2)}</span>
                    </div>
                    <div className="controles-qtd">
                      <button onClick={() => alterarQuantidade(i.id, -1)}>-</button>
                      <span className="qtd-num">{i.qtd}</span>
                      <button onClick={() => alterarQuantidade(i.id, 1)}>+</button>
                    </div>
                    <button className="btn-remover" onClick={() => removerDoCarrinho(i.id)}>🗑️</button>
                  </div>
                ))}
                <div className="resumo-carrinho">
                  <h3>Total: R$ {totalProd.toFixed(2)}</h3>
                  <div className="botoes-fluxo">
                    <button className="btn-secundario" onClick={() => setEtapa('vitrine')}>Continuar Comprando</button>
                    <button className="btn-p" onClick={() => setEtapa('login')}>Finalizar Pedido</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}           
{etapa === 'login' && (
  <div className="container-venda">
    <h2>{modoCadastro ? "📝 Cadastro" : "🔐 Login"}</h2>
    
    {/* Campos comuns tanto para Login quanto para Cadastro */}
    <input 
      className="in-v" 
      placeholder="E-mail" 
      onChange={e => setFormData({...formData, email: e.target.value})} 
    />
    <input 
      className="in-v" 
      type="password" 
      placeholder="Senha" 
      onChange={e => setFormData({...formData, senha: e.target.value})} 
    />

    {/* Campos EXCLUSIVOS do Cadastro */}
    {modoCadastro && (
      <>
        <input 
          className="in-v" 
          placeholder="Nome Completo" 
          onChange={e => setFormData({...formData, nome: e.target.value})} 
        />
        <input 
          className="in-v" 
          type="text" 
          placeholder="Telefone (DDD + Número)" 
          onChange={e => setFormData({...formData, telefone: e.target.value})} 
        />
        <input 
          className="in-v" 
          placeholder="CEP" 
          onChange={e => setFormData({...formData, cep: e.target.value})} 
        />
        <input 
          className="in-v" 
          placeholder="Endereço Completo" 
          onChange={e => setFormData({...formData, endereco: e.target.value})} 
        />
        <input 
          className="in-v" 
          placeholder="CPF (apenas números)" 
          onChange={e => setFormData({...formData, cpf: e.target.value})} 
        />
      </>
    )}

    <button className="btn-p" onClick={handleAuth}>
      {modoCadastro ? "Finalizar Cadastro" : "Entrar"}
    </button>
    
    <p className="link-troca" onClick={() => setModoCadastro(!modoCadastro)}>
      {modoCadastro ? "Já tem conta? Faça Login" : "Não tem conta? Cadastre-se"}
    </p>
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