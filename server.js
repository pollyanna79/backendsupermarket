import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Conexão com o Banco de Dados
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('❌ ERRO AO CONECTAR NO MYSQL:', err.message);
  } else {
    console.log('✅ BANCO CONECTADO COM SUCESSO!');
  }
});

// --- ROTAS ---

// Vitrine de Produtos
app.get('/produtos', (req, res) => {
  db.query('SELECT * FROM estoque.produtos', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Cadastro de Clientes (CORRIGIDO)
app.post('/cadastrar', (req, res) => {
  const { nome, email, senha, telefone, cep, endereco, cpf } = req.body;
  
  const query = "INSERT INTO estoque.clientes (nome, email, senha, telefone, cep, endereco, cpf) VALUES (?, ?, ?, ?, ?, ?, ?)";
  const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : '';
  const valores = [nome, email, senha, telefone, cep, endereco, cpfLimpo];

  db.query(query, valores, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ 
      id: result.insertId, 
      nome, 
      email 
    });
  });
});

// Login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  const query = "SELECT id AS id_cliente, nome, email, endereco, cep FROM estoque.clientes WHERE email = ? AND senha = ?";
  db.query(query, [email, senha], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.length > 0) {
      res.status(200).json(result[0]);
    } else {
      res.status(401).json({ message: "E-mail ou senha incorretos" });
    }
  });
});

// Rota de Vendas (FINALMENTE CORRIGIDA)
app.post('/venda_cliente', (req, res) => {
  console.log("-----------------------------------------");
    console.log("🚨 O BOTAO FOI CLICADO E O DADO CHEGOU!");
    console.log("-----------------------------------------");
  const { id_pedido, id_cliente, produto, quantidade, valor, id_produto } = req.body;

  // LOG DE CONTROLE: Veja se esses valores aparecem no terminal do VS Code
  console.log("--- TENTATIVA DE VENDA ---");
  console.log("Pedido:", id_pedido, "| Cliente:", id_cliente, "| Produto ID:", id_produto);
  const queryVenda = `
    INSERT INTO estoque.venda_cliente (id_pedido, id_cliente, produto, quantidade, valor, data_venda, id_produto) 
    VALUES (?, ?, ?, ?, ?, NOW(), ?)
  `;

  // Array de valores seguindo exatamente a ordem das interrogações (?) acima
  const valoresVenda = [
    id_pedido,    // 1º ?
    Number(id_cliente),
    produto,      // 3º ?
    quantidade,   // 4º ?
    valor,        // 5º ?
    id_produto    // 6º ? (Referente à coluna id_produto no final)
  ];

  db.query(queryVenda, valoresVenda, (err, result) => {
    if (err) {
      // ESTA LINHA É A MAIS IMPORTANTE: Ela vai imprimir o erro real no terminal
      console.error("❌ ERRO CRÍTICO NO BANCO:", err.code, "-", err.message);
      return res.status(500).json({ error: err.message, codigo: err.code });
    }

    // Se chegou aqui, a venda gravou. Agora tenta o estoque.
    const queryEstoque = "UPDATE estoque.produtos SET estoque = estoque - ? WHERE id = ?";
    db.query(queryEstoque, [quantidade, id_produto], (errE) => {
      if (errE) console.error("⚠️ Erro no estoque:", errE.message);
      res.status(200).json({ message: "Sucesso!" });
    });
  });
});
// --- NOVA ROTA: HISTÓRICO DE PEDIDOS ---
app.get('/historico/:id_cliente', (req, res) => {
  const { id_cliente } = req.params;

  // IMPORTANTE: Use "cadastro", que é o nome da coluna na sua VIEW
  const query = "SELECT * FROM estoque.historico_pedidos WHERE cadastro = ?";

  db.query(query, [id_cliente], (err, results) => {
    if (err) {
      console.error("Erro na consulta:", err);
      return res.status(500).json([]);
    }
    
    // Filtro de segurança: Remove a linha "vazia" que a VIEW cria caso o cliente não tenha pedidos reais
    const pedidosReais = results.filter(p => p.numero_pedido !== 'Você não possui pedidos!');
    
    res.json(pedidosReais);
  });
});x


app.listen(PORT, () => console.log(`🚀 Server on: http://localhost:${PORT}`));