const jwt = require('jsonwebtoken');

// RNF02 - Autenticação segura / RNF03 - Isolamento dos dados de cada usuário
function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token de acesso não informado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioId = payload.id; // usado por todas as rotas para filtrar dados por usuário
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

module.exports = autenticar;
