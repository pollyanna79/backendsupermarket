import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', // Caso use Vite localmente
  'https://backendsupermarket-imx5af751-pollyannasanto.vercel.app', // Sua URL atual da Vercel
  process.env.FRONTEND_URL // Mantém a variável de ambiente se você configurar no painel
];
const corsOptions = {
  origin: function (origin, callback) {
    // Permite requisições sem origem (como aplicativos mobile, Postman ou a própria API testando local)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pelo CORS: Esta origem não é permitida.'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// A Clever Cloud define automaticamente a porta correta na variável process.env.PORT
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Configuração adaptada com as variáveis automáticas da Clever Cloud
const db = mysql.createPool({
  host: process.env.MYSQL_ADDON_HOST,
  user: process.env.MYSQL_ADDON_USER,
  password: process.env.MYSQL_ADDON_PASSWORD,
  database: process.env.MYSQL_ADDON_DB,
  port: process.env.MYSQL_ADDON_PORT || 3306, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
  // Removido o bloco SSL obrigatório do TiDB antigo para evitar conflitos no MySQL da Clever Cloud
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ ERRO AO OBTER CONEXÃO DO POOL:', err.message);
  } else {
    console.log('✅ CONECTADO AO MYSQL DA CLEVER CLOUD VIA POOL!');
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

// Rota de Vendas
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

    const queryVenda = "INSERT INTO venda_cliente (id, id_pedido, id_cliente, produto, quantidade, valor, data_venda, id_produto, foto_produto) VALUES ?";

    db.query(queryVenda, [valores], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Atualização de estoque
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














































































































































































































































































































































































































































