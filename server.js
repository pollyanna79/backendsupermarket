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
  db.query('SELECT * FROM produtos', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Cadastro de Clientes (CORRIGIDO)
app.post('/cadastrar', (req, res) => {
  const { nome, email, senha, telefone, cep, endereco, cpf } = req.body;
  
  const query = "INSERT INTO clientes (nome, email, senha, telefone, cep, endereco, cpf) VALUES (?, ?, ?, ?, ?, ?, ?)";
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
  const query = "SELECT id, nome, email, endereco, cep FROM clientes WHERE email = ? AND senha = ?";
  
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
app.post('/vendas', (req, res) => {
  const { id_pedido, id_cliente, produto, quantidade, valor, id_produto } = req.body;

  console.log(`>>> Gravando Pedido: ${id_pedido} | Cliente: ${id_cliente} | Produto ID: ${id_produto}`);

  // Query respeitando a ordem do seu banco: id_pedido, id_cliente, produto, quantidade, valor, data_venda, id_produto
  const queryVenda = `
    INSERT INTO venda_cliente (id_pedido, id_cliente, produto, quantidade, valor, data_venda, id_produto) 
    VALUES (?, ?, ?, ?, ?, NOW(), ?)
  `;

  // Array de valores seguindo exatamente a ordem das interrogações (?) acima
  const valoresVenda = [
    id_pedido,    // 1º ?
    id_cliente,   // 2º ?
    produto,      // 3º ?
    quantidade,   // 4º ?
    valor,        // 5º ?
    id_produto    // 6º ? (Referente à coluna id_produto no final)
  ];

  db.query(queryVenda, valoresVenda, (err, result) => {
    if (err) {
      console.error("❌ ERRO NO MYSQL:", err.message);
      return res.status(500).json({ error: err.message });
    }

    // Após inserir a venda, atualiza o estoque
    const queryEstoque = "UPDATE produtos SET estoque = estoque - ? WHERE id = ?";
    db.query(queryEstoque, [quantidade, id_produto], (errE) => {
      if (errE) console.error("⚠️ Erro estoque:", errE.message);
      
      // Enviamos apenas UMA resposta para o cliente
      res.status(200).json({ message: "Venda registrada com sucesso!" });
    });
  });
});

app.listen(PORT, () => console.log(`🚀 Server on: http://localhost:${PORT}`));