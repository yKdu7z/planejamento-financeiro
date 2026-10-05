<?php
/**
 * Cadastro, login, logout e perfil do usuário (RF01-RF03).
 */
class AuthController
{
    private UsuarioModel $usuarios;

    public function __construct()
    {
        $this->usuarios = new UsuarioModel();
    }

    // RF01 - Cadastro de usuário
    public function cadastrar(Request $req): Resposta
    {
        $nome = trim((string) $req->campo('nome', ''));
        $email = trim((string) $req->campo('email', ''));
        $senha = (string) $req->campo('senha', '');

        if ($nome === '' || $email === '' || $senha === '') {
            throw new ErroHttp(400, 'Nome, e-mail e senha são obrigatórios.');
        }
        if (strlen($senha) < 6) {
            throw new ErroHttp(400, 'A senha deve ter ao menos 6 caracteres.');
        }
        if ($this->usuarios->buscarPorEmail($email)) {
            throw new ErroHttp(409, 'Já existe uma conta com este e-mail.');
        }

        $id = $this->usuarios->criar(
            $nome,
            $email,
            password_hash($senha, PASSWORD_DEFAULT), // senha nunca é salva em texto puro
            (float) $req->campo('salario', 0),
            $req->campo('moeda') ?: 'BRL'
        );
        (new CategoriaModel())->criarPadrao($id);

        Auth::entrar($id);
        return Resposta::json(['usuario' => $this->dadosPublicos($this->usuarios->buscarPorId($id))], 201);
    }

    // RF02 - Login de usuário
    public function login(Request $req): Resposta
    {
        $email = trim((string) $req->campo('email', ''));
        $senha = (string) $req->campo('senha', '');

        if ($email === '' || $senha === '') {
            throw new ErroHttp(400, 'Informe e-mail e senha.');
        }

        $usuario = $this->usuarios->buscarPorEmail($email);
        if (!$usuario || !password_verify($senha, $usuario['senha'])) {
            throw new ErroHttp(401, 'E-mail ou senha inválidos.');
        }

        Auth::entrar($usuario['id']);
        return Resposta::json(['usuario' => $this->dadosPublicos($usuario)]);
    }

    // RF03 - Logout de usuário
    public function logout(Request $req): Resposta
    {
        Auth::sair();
        return Resposta::json(['mensagem' => 'Logout realizado com sucesso.']);
    }

    // Gerenciamento de informações do perfil
    public function perfil(Request $req): Resposta
    {
        return Resposta::json($this->usuarios->perfil($req->usuarioId));
    }

    public function atualizarPerfil(Request $req): Resposta
    {
        $atual = $this->usuarios->buscarPorId($req->usuarioId);
        $novaSenha = $req->campo('senha');

        if ($novaSenha !== null && $novaSenha !== '' && strlen((string) $novaSenha) < 6) {
            throw new ErroHttp(400, 'A senha deve ter ao menos 6 caracteres.');
        }

        $this->usuarios->atualizar(
            $req->usuarioId,
            $req->campo('nome') ?: $atual['nome'],
            (float) $req->campo('salario', $atual['salario']),
            $req->campo('moeda') ?: $atual['moeda'],
            $novaSenha ? password_hash((string) $novaSenha, PASSWORD_DEFAULT) : $atual['senha']
        );

        return Resposta::json(['mensagem' => 'Perfil atualizado com sucesso.']);
    }

    private function dadosPublicos(array $usuario): array
    {
        return [
            'id' => $usuario['id'],
            'nome' => $usuario['nome'],
            'email' => $usuario['email'],
            'salario' => $usuario['salario'],
            'moeda' => $usuario['moeda'],
        ];
    }
}
