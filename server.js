import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://seu-projeto-react.vercel.app', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ ERRO AO OBTER CONEXÃO DO POOL:', err.message);
  } else {
    console.log('✅ CONECTADO AO MYSQL VIA POOL!');
    connection.release(); // Libera a conexão de volta para o pool
  }
});

// --- ROTAS ---

app.get('/produtos', (req, res) => {
  db.query('SELECT * FROM produtos', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/cadastrar', (req, res) => {
  const { nome, email, senha, telefone, cep, endereco, cpf } = req.body;
  const query = "INSERT INTO clientes (nome, email, senha, telefone, cep, endereco, cpf) VALUES (?, ?, ?, ?, ?, ?, ?)";
  const valores = [nome, email, senha, telefone, cep, endereco, cpf?.replace(/\D/g, '')];
  db.query(query, valores, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ id: result.insertId, nome, email });
  });
});

// Login Ajustado
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  // 1. Verificação básica para evitar processamento inútil
  if (!email || !senha) {
    return res.status(400).json({ message: "E-mail e senha são obrigatórios." });
  }

  // 2. Query selecionando todos os dados que você quer levar para o Frontend
  const query = `
    SELECT 
      id AS id_cliente, 
      nome, 
      telefone, 
      cep, 
      endereco, 
      cpf, 
      email 
    FROM clientes 
    WHERE email = ? AND senha = ?
  `;

  db.query(query, [email, senha], (err, result) => {
    if (err) {
      console.error("❌ Erro no Login:", err.message);
      return res.status(500).json({ message: "Erro interno no servidor." });
    }

    if (result.length > 0) {
      // Login com sucesso: Retornamos os dados do usuário (menos a senha por segurança)
      console.log(`✅ Usuário ${result[0].nome} logado.`);
      res.status(200).json(result[0]);
    } else {
      // Erro de credenciais
      res.status(401).json({ message: "E-mail ou senha incorretos" });
    }
  });
});

// Rota de Vendas (CORRIGIDA)
app.post('/venda_cliente', (req, res) => {
  const { id_pedido, id_cliente, itens } = req.body;
  console.log("RECEBI NO BACKEND:", itens[0]);

  if (!id_cliente || !itens) return res.status(400).send("Dados incompletos");

  const obterProximoPedido = () => {
    return new Promise((resolve, reject) => {
      db.query('SELECT IFNULL(MAX(id_pedido), 0) + 1 AS proximo FROM venda_cliente', (err, results) => {
        if (err) reject(err);
        else resolve(results[0].proximo);
      });
    });
  };

  const gravarVenda = (pedidoId) => {
    // Adicionando item.imagem_url na gravação
    const valores = itens.map(item => [
      null, 
      pedidoId, 
      Number(id_cliente), 
      item.produto, 
      item.quantidade, 
      item.valor, 
      new Date(), 
      item.id_produto,
      item.imagem_url 
    ]);

    // Ajuste a query abaixo incluindo o nome da coluna de imagem que existe no seu banco
    const queryVenda = "INSERT INTO venda_cliente (id, id_pedido, id_cliente, produto, quantidade, valor, data_venda, id_produto, foto_produto) VALUES ?";

    db.query(queryVenda, [valores], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      
   // Atualização de estoque simplificada para não travar a resposta
    itens.forEach(item => {
      db.query('UPDATE produtos SET estoque = estoque - ? WHERE id = ?', [item.quantidade, item.id_produto]);
    });

    res.status(200).json({ success: true, id_pedido: pedidoId });
  });
  };

  obterProximoPedido().then(gravarVenda).catch(e => res.status(500).send(e.message));
});

app.get('/historico/:id_cliente', (req, res) => {
  const query = "SELECT * FROM historico_pedidos WHERE cadastro = ?";
  db.query(query, [req.params.id_cliente], (err, results) => {
    if (err) return res.status(500).json([]);
    res.json(results.filter(p => p.numero_pedido !== 'Você não possui pedidos!'));
  });
});

app.get('/api/promocao_10', (req, res) => {
    db.query("SELECT * FROM promocao_10", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});















































































































































































































































































































































































































































