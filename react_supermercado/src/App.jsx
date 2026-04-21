import React, { useState, useEffect } from 'react';
import './App.css';
import Topo from "./componentes/TopoOferta";
import Rodape from "./componentes/Rodape";
import { buscarOfertasPromocao } from "./componentes/ofertasService";
import API_URL from './config.js';
function App() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [etapa, setEtapa] = useState('vitrine');
  const [modoCadastro, setModoCadastro] = useState(false);
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem('usuario_logado');
    return salvo ? JSON.parse(salvo) : null;
  });
  const [formaPagamento, setFormaPagamento] = useState('');
  const [pedidoFinalizado, setPedidoFinalizado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [ofertas, setOfertas] = useState([]);
  const [origemLogin, setOrigemLogin] = useState('checkout');
  const [formData, setFormData] = useState({ nome: '', email: '', senha: '', telefone: '', cep: '', endereco: '', cpf: '' });
  const [tempo, setTempo] = useState(86400);

  useEffect(() => {
    const carregarDadosIniciais = async () => {
      try {
        const res = await fetch(`${API_URL}/produtos`);
        const dados = await res.json();
        setProdutos(dados);
      } catch (err) {
        console.error("Erro ao carregar vitrine inicial:", err);
      }
    };

    const carregarOfertas = async () => {
      try {
        const res = await fetch(`${API_URL}/api/promocao_10`);
        const dados = await res.json();
        setOfertas(dados);
      } catch (err) {
        console.error("Erro ao carregar ofertas:", err);
      }
    };

    carregarDadosIniciais();
    carregarOfertas();
  }, []);

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

  // --- FUNÇÕES AUXILIARES ---
  const fazerLogout = () => {
    localStorage.removeItem('usuario_logado');
    setUsuario(null);
    setEtapa('vitrine');
    window.location.reload();
  };

  const adicionarAoCarrinho = (p) => {
  const itemExiste = carrinho.find(item => item.id === p.id);
  
  if (itemExiste) {
    setCarrinho(carrinho.map(item => 
      item.id === p.id ? { ...item, qtd: item.qtd + 1 } : item
    ));
    } else {
      const oferta = encontrarOfertaPorDescricao(p, ofertas);
      const valorPromocional = oferta && p.secao !== 'DPH' ? (p.Valor_antigo ? obterPrecoPromocional(p) : parseFloat(p.valor || p.preco || 0) * 0.9) : null;
      setCarrinho([
      ...carrinho, 
      { 
        ...p, 
        qtd: 1, 
        precoPromocional: valorPromocional,
        // GARANTIA DA FOTO: 
        // Se o banco de produtos usa 'imagem_url', garantimos que ela 
        // seja passada com o nome que a função finalizar espera.
        imagem_url: p.imagem_url || p.foto || p.imagem 
      }
    ]);
  }
};

  const alterarQuantidade = (id, delta) => {
    setCarrinho(carrinho.map(item => {
      if (item.id === id) {
        const novaQtd = item.qtd + delta;
        return novaQtd > 0 ? { ...item, qtd: novaQtd } : item;
      }
      return item;
    }).filter(item => item.qtd > 0));
  };

  const removerDoCarrinho = (id) => {
    setCarrinho(carrinho.filter(item => item.id !== id));
  };

  const obterPrecoPromocional = (produto) => {
    // Se tem Valor_antigo, calcular 10% desconto
    if (produto.Valor_antigo !== undefined && produto.Valor_antigo !== null) {
      const valorAntigo = parseFloat(produto.Valor_antigo);
      if (!Number.isNaN(valorAntigo)) {
        return valorAntigo * 0.9;
      }
    }

    const campos = [
      'Desconto_10porct',
      'desconto_10porct',
      'valor_promocional',
      'valorPromocional',
      'preco_promocional',
      'precoPromocional',
      'valor_oferta',
      'preco_oferta',
      'valor_desconto',
      'preco_desconto',
      'valorPromo',
      'precoPromo',
      'promocao',
      'promo',
      'desconto'
    ];

    for (const campo of campos) {
      if (produto[campo] !== undefined && produto[campo] !== null && produto[campo] !== '') {
        return produto[campo];
      }
    }

    return null;
  };

  const precoEfetivoProduto = (produto) => {
    if (produto.precoPromocional !== undefined && produto.precoPromocional !== null && produto.precoPromocional !== '') {
      return parseFloat(produto.precoPromocional);
    }

    const promocional = obterPrecoPromocional(produto);
    return promocional !== null && promocional !== undefined && promocional !== ''
      ? parseFloat(promocional)
      : parseFloat(produto.valor || produto.preco || 0);
  };

  const totalProd = carrinho.reduce((acc, i) => {
    return acc + (precoEfetivoProduto(i) * i.qtd);
  }, 0);

  const valorFrete = formaPagamento === 'pix' ? 0 : 15.00;
  const valorTotalFinal = totalProd + valorFrete;

  const precoAntigoProduto = (produto) => {
    return parseFloat(
      produto.Valor_antigo ||
      produto.valor_antigo ||
      produto.preco_antigo ||
      produto.precoAntigo ||
      produto.valor ||
      produto.preco ||
      0
    );
  };

  // --- MÉTODOS DE AUTENTICAÇÃO E HISTÓRICO ---
const handleAuth = async () => {
    // --- NOVAS VALIDAÇÕES ---
    if (modoCadastro) {
      const { email, senha, nome, cpf, telefone, cep, endereco } = formData;

      // Verifica se todos os campos estão preenchidos
      if (!nome || !email || !senha || !cpf || !telefone || !cep || !endereco) {
        alert("Por favor, preencha todos os campos para o cadastro.");
        return;
      }

      // Validação de E-mail
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("Por favor, insira um e-mail válido.");
        return;
      }

      // Validação de Senha Forte: 8+ caracteres, 1 maiúscula, 1 número, 1 caractere especial
      const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!senhaRegex.test(senha)) {
        alert(
          "A senha deve ter no mínimo 8 caracteres, incluindo uma letra maiúscula, um número e um caractere especial (@$!%*?&)."
        );
        return;
      }
    } else {
      // No login, apenas verifica se e-mail e senha foram digitados
      if (!formData.email || !formData.senha) {
        alert("Preencha e-mail e senha para entrar.");
        return;
      }
    }
    // --- FIM DAS VALIDAÇÕES ---
const rota = modoCadastro ? 'cadastrar' : 'login';
  try {
    const response = await fetch(`${API_URL}/${rota}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    
    const dados = await response.json();

    if (response.ok) {
      // SALVA O USUÁRIO LOGADO
      setUsuario(dados);
      localStorage.setItem('usuario_logado', JSON.stringify(dados));

      // DIRECIONAMENTO INTELIGENTE
      if (carrinho.length > 0 && origemLogin !== 'historico') {
        setEtapa('checkout');
      } 
      else if (origemLogin === 'historico') {
        const idParaBusca = dados.id_cliente || dados.id;
        const resH = await fetch(`${API_URL}/historico/${idParaBusca}`);
        const dadosH = await resH.json();
        setHistorico(Array.isArray(dadosH) ? dadosH : []);
        setEtapa('historico');
      } else {
        setEtapa('checkout');
      }
      setOrigemLogin('checkout'); 
    } else {
      alert(dados.message || "Erro na autenticação. Verifique seus dados.");
    }
  } catch (err) {
    alert("Erro de conexão com o servidor.");
  }
};
     const carregarHistorico = () => {
    // 1. Limpa o utilizador para forçar novo login
    localStorage.removeItem('usuario_logado');
    setUsuario(null);
    // 2. Prepara o caminho para o login pedir e-mail/senha
    setOrigemLogin('historico');
    setEtapa('login');
  };

  const carregarOfertas = async () => {
    const ofertas = await buscarOfertasPromocao();
    if (ofertas.length > 0) {
      // Filtrar produtos que não são da seção DPH
      const ofertasFiltradas = ofertas.filter(oferta => oferta.secao !== 'DPH');
      setProdutos(ofertasFiltradas);
      setEtapa('vitrine');
    } else {
      alert("Nenhuma oferta encontrada.");
    }
  };

  const normalizarTexto = (texto) => {
    return String(texto || '').trim().toLowerCase();
  };

  const obterValorOferta = (oferta) => {
    // Se houver Valor_antigo, calcular 10% desconto: Valor_antigo * 0.9
    if (oferta.Valor_antigo !== undefined && oferta.Valor_antigo !== null) {
      const valorAntigo = parseFloat(oferta.Valor_antigo);
      if (!Number.isNaN(valorAntigo)) {
        return valorAntigo * 0.9;
      }
    }


    // Fallback para outros campos
    const camposValor = [
      'Desconto_10porct',
      'desconto_10porct',
      'valor_promocional',
      'valorPromocional',
      'preco_promocional',
      'precoPromocional',
      'valor_oferta',
      'preco_oferta',
      'valor_desconto',
      'preco_desconto',
      'valorPromo',
      'precoPromo',
      'valor',
      'preco',
      'promocao',
      'promo',
      'desconto'
    ];

    for (const campo of camposValor) {
      if (oferta[campo] !== undefined && oferta[campo] !== null && oferta[campo] !== '') {
        const valor = parseFloat(oferta[campo]);
        if (!Number.isNaN(valor)) return valor;
      }
    }

    return null;
  };

  const encontrarOfertaPorDescricao = (item, ofertas) => {
    const nomeItem = normalizarTexto(item.descricao || item.produto || item.nome);
    return ofertas.find((promo) => {
      const nomeOferta = normalizarTexto(promo.produto || promo.descricao || promo.nome);
      const correspondeId = promo.id === item.id || promo.id_produto === item.id || promo.id === item.id_produto || promo.id_produto === item.id_produto;
      const correspondeNome = nomeOferta !== '' && nomeItem !== '' && nomeOferta === nomeItem;
      return correspondeId || correspondeNome;
    }) || null;
  };

  const finalizar = async () => {
    const userAtual = usuario || JSON.parse(localStorage.getItem('usuario_logado'));
    if (!userAtual) return setEtapa('login');
    try {
      const itensEnvio = carrinho.map((item) => ({
        id_produto: item.id,
        produto: item.produto,
        quantidade: item.qtd || 1,
        valor: precoEfetivoProduto(item),
        imagem_url: item.imagem_url 
      }));

      const response = await fetch(`${API_URL}/venda_cliente`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_cliente: userAtual.id || userAtual.id_cliente,
          itens: itensEnvio
        })


      });
      const dados = await response.json();
      if (!response.ok) {
        throw new Error(dados.error || dados.message || 'Erro ao finalizar pedido');
      }

      setPedidoFinalizado({
        numero: dados.id_pedido || dados.id || dados.numero_pedido || 'N/A',
        mensagem: 'Pedido em separação, enviaremos para o e-mail o andamento do pedido'
      });
      setEtapa('sucesso');
      setCarrinho([]);
    } catch (err) {
      alert("Falha no Pedido: " + err.message);
    }
  };

  return (
    <div className="App">
      <Topo 
        totalItens={carrinho.length} 
        abrirCarrinho={() => setEtapa('carrinho')} 
        verHistorico={carregarHistorico} 
        usuarioLogado={usuario} 
        onLogout={fazerLogout}
        verOfertas={carregarOfertas}
      />
      
      <main className="conteudo-principal">
        {etapa === 'vitrine' && (
          <div className="container-vitrine">
            {produtos.some(p => obterPrecoPromocional(p) !== null) && (
              <div className="barra-topo-ofertas">
                <div className="linha-superior">
                <button className="btn-voltar-inicial" onClick={() => window.location.reload()}>🏠 Início</button>
                <h2 className="titulo-ofertas">🔥 Ofertas do Dia</h2>
                <span className="timer-ofertas">Acaba em {formatarTempo(tempo)}</span>
           </div>
          
          <div className="texto-chamada">
            <p className="subtitulo-ofertas">Ofertas Válidas enquanto durarem os estoques</p>
          </div>
        </div>
      )}
            <div className="grid-produtos">
              {produtos.map((p) => {
                const precoPromocional = obterPrecoPromocional(p);
                const temOferta = precoPromocional !== null && precoPromocional !== undefined && precoPromocional !== '' && p.secao !== 'DPH';
                const precoAntigo = parseFloat(p.valor || p.preco || p.Valor_antigo || 0).toFixed(2);
                return (
                  <div key={p.id} className="card">
                    <img src={p.imagem_url || p.foto} alt={p.produto} />
                    <h3>{p.produto}</h3>

                    <div className="preco-container">
                      {temOferta ? (
                        <div className="preco-promocional">
                          <div>
                            <span className="texto-label-promocao">De: </span>
                            <span className="preco-antigo">R$ {precoAntigo}</span>
                          </div>
                          <div>
                            <span className="texto-label-promocao">Por: </span>
                            <span className="preco-novo">R$ {parseFloat(precoPromocional).toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="preco-normal">R$ {parseFloat(p.valor || 0).toFixed(2)}</span>
                      )}
                    </div>

                    {/* Botão de compra com a classe correta */}
                    <button className="btn-comprar" onClick={() => adicionarAoCarrinho(p)}>
                      🛒 Comprar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* --- INÍCIO DA ETAPA CARRINHO --- */}
{etapa === 'carrinho' && (
  <div className="container-venda">
    <h2>🛒 Carrinho</h2>
   
    
    {carrinho.length === 0 ? (
      <div style={{ marginTop: '20px' }}>
        <p>Seu carrinho está vazio.</p>
        <button className="btn-p" onClick={() => setEtapa('vitrine')}>Voltar à vitrine</button>
      </div>
    ) : (
      <>
        {carrinho.map((item) => {
          const precoAtual = precoEfetivoProduto(item).toFixed(2);
          const subtotal = (precoEfetivoProduto(item) * item.qtd).toFixed(2);

          return (
            <div key={item.id} className="item-carrinho-detalhado carrinho-item">
              <img className="img-mini" src={item.imagem_url || item.foto} alt={item.produto} />
              <div className="carrinho-item-info">
                <strong>{item.produto}</strong>
                <p>Quantidade: <strong>{item.qtd}</strong></p>
              </div>
              <div className="carrinho-item-valores">
                <span className="preco-novo">R$ {precoAtual}</span>
                <span style={{ fontSize: '0.85rem' }}>Total: R$ {subtotal}</span>
                <button className="btn-p" onClick={() => removerDoCarrinho(item.id)}>Remover</button>
              </div>
            </div>
          );
        })}

        <div className="carrinho-resumo">
          <p>Total produtos: <strong>R$ {totalProd.toFixed(2)}</strong></p>
          <button 
            className="btn-p" 
            onClick={() => { 
              console.log("Indo para o login..."); // Log para testar se o clique funciona
              setOrigemLogin('checkout'); 
              setEtapa('login'); 
            }}
          >
            Finalizar Compra
          </button>
        </div>
      </> 
    )}
  </div>
)}
{/* --- FIM DA ETAPA CARRINHO --- */}
        {etapa === 'login' && (
  <div className="container-venda">
    <h2>{modoCadastro ? "📝 Criar Conta" : "🔐 Acessar Sistema"}</h2>

    {/* Campos exclusivos do CADASTRO */}
    {modoCadastro && (
      <>
        <input 
          className="in-v" 
          placeholder="Nome Completo" 
          onChange={e => setFormData({...formData, nome: e.target.value})} 
        />
        <input 
          className="in-v" 
          placeholder="Telefone" 
          onChange={e => setFormData({...formData, telefone: e.target.value})} 
        />
        <input 
          className="in-v" 
          placeholder="CPF (apenas números)" 
          maxLength="11"
          onChange={e => setFormData({...formData, cpf: e.target.value})} 
        />
        <div style={{ display: 'flex', gap: '5px' }}>
          <input 
            className="in-v" 
            style={{ width: '40%' }}
            placeholder="CEP" 
            onChange={e => setFormData({...formData, cep: e.target.value})} 
          />
          <input 
            className="in-v" 
            placeholder="Endereço" 
            onChange={e => setFormData({...formData, endereco: e.target.value})} 
          />
        </div>
      </>
    )}

    {/* Campos comuns: LOGIN e CADASTRO */}
    <input 
      className="in-v" 
      type="email" 
      placeholder="E-mail" 
      onChange={e => setFormData({...formData, email: e.target.value})} 
    />
    
    <input 
      className="in-v" 
      type="password" 
      placeholder="Senha" 
      onChange={e => setFormData({...formData, senha: e.target.value})} 
    />

    {/* Botão de ação */}
    <button className="btn-p" onClick={handleAuth}>
      {modoCadastro ? "Finalizar Cadastro" : "Entrar"}
    </button>

    <p onClick={() => setModoCadastro(!modoCadastro)} style={{cursor:'pointer', marginTop: '10px'}}>
      {modoCadastro ? "Já tem conta? Voltar para Login" : "Não tem conta? Cadastre-se aqui"}
    </p>

    {origemLogin === 'historico' && (
      <button className="btn-voltar-inicial" onClick={() => setEtapa('vitrine')}>
        🏠 Início
      </button>
    )}
  </div>
)}
{etapa === 'historico' && (
  <div className="container-venda">
    <div className="cabecalho-historico" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <h2>📋 Meus Pedidos</h2>
      <button className="btn-voltar-inicial" onClick={() => setEtapa('vitrine')}>🏠 Início</button>
    </div>

    {historico.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Você ainda não realizou nenhum pedido.</p>
        <button className="btn-p" onClick={() => setEtapa('vitrine')}>Ir às Compras</button>
      </div>
    ) : (
      <div className="lista-pedidos" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {historico.map((ped, idx) => {
          console.log(`Verificando Pedido #${ped.numero_pedido}:`, ped.foto_produto);
          // Lógica para capturar a imagem de qualquer uma das colunas possíveis
          const imagemProduto = ped.foto_produto || ped.imagem_url || ped.foto || ped.imagem;
          
          return (
            <div key={idx} className="card-historico" style={{ 
              display: 'flex', 
              gap: '15px', 
              borderBottom: '1px solid #eee', 
              padding: '15px', 
              alignItems: 'center',
              backgroundColor: '#fff',
              marginBottom: '10px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              
              {/* Espaço da Imagem com fallback (caso a imagem não carregue) */}
              <div className="thumb-historico" style={{ width: '70px', height: '70px', flexShrink: 0 }}>
                <img 
                  src={imagemProduto || 'https://via.placeholder.com/70?text=Sem+Foto'} 
                  alt={ped.produto || "Produto"} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/70?text=Sem+Foto'; }} 
                />
              </div>

              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>Pedido #{ped.numero_pedido || ped.id_pedido}</span>
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>
                    {ped.data_venda ? new Date(ped.data_venda).toLocaleDateString('pt-BR') : ''}
                  </span>
                </div>
                
                <p style={{ fontSize: '0.9rem', margin: '0 0 5px 0', color: '#555' }}>
                  {ped.itens_do_pedido || ped.produto || 'Descrição indisponível'}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>
                    Qtd: {ped.quantidade || ped.quantidade || 1}
                  </span>
                  <span style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '1rem' }}>
                    R$ {parseFloat(ped.valor_total_pedido || ped.valor || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}
        {etapa === 'checkout' && (
           <div className="container-venda">
            <h2>📍 Resumo do Pedido</h2>
            <div className="checkout-dados-cliente" style={{ textAlign: 'left', marginBottom: '20px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
             <p><strong>Cliente:</strong> {usuario?.nome}</p>
             <p><strong>Endereço:</strong> {usuario?.endereco} - CEP: {usuario?.cep}</p>
            <p><strong>Telefone:</strong> {usuario?.telefone}</p>
            </div>
            <div className="checkout-itens" style={{ marginBottom: '20px' }}>
      {carrinho.map(item => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
          <img src={item.imagem_url || item.foto} alt={item.produto} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px' }} />
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{item.produto}</p>
            <small>{item.qtd}x R$ {precoEfetivoProduto(item).toFixed(2)}</small>
          </div>
        </div>
      ))}
    </div>
             <select className="in-v" value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
               <option value="">Pagamento...</option>
               <option value="pix">Pix</option>
               <option value="cartao">Cartão</option>
             </select>
             <div className="checkout-resumo">
               <p>Subtotal: <strong>R$ {totalProd.toFixed(2)}</strong></p>
               <p>Frete: <strong>R$ {valorFrete.toFixed(2)}</strong></p>
               <p>Total a pagar: <strong>R$ {valorTotalFinal.toFixed(2)}</strong></p>
               <p style={{ fontSize: '0.9rem', color: '#555' }}>
                 {formaPagamento === 'pix' ? 'Pagamento via Pix com frete grátis' : 'Pagamento com cartão inclui frete de R$ 15,00'}
               </p>
             </div>
             <button className="btn-p" onClick={finalizar} disabled={!formaPagamento}>
               Confirmar Pedido
             </button>
           </div>
        )}

        {etapa === 'sucesso' && (
          <div className="alerta-s">
            <h2>✅ Pedido Confirmado!</h2>
            {pedidoFinalizado?.numero && (
              <p>Número do pedido: <strong>{pedidoFinalizado.numero}</strong></p>
            )}
            <p>{pedidoFinalizado?.mensagem}</p>
            <button className="btn-p" onClick={() => setEtapa('vitrine')}>Voltar</button>
          </div>
        )}
      </main>
      <Rodape />
    </div>
  );
}

export default App;