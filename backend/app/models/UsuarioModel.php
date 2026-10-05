<?php
/**
 * Acesso à tabela usuarios.
 */
class UsuarioModel
{
    public function buscarPorEmail(string $email): ?array
    {
        return Database::um('SELECT * FROM usuarios WHERE email = ?', [$email]);
    }

    public function buscarPorId(int $id): ?array
    {
        return Database::um('SELECT * FROM usuarios WHERE id = ?', [$id]);
    }

    /** Dados do perfil, sem o hash da senha */
    public function perfil(int $id): ?array
    {
        return Database::um(
            'SELECT id, nome, email, salario, moeda, criado_em FROM usuarios WHERE id = ?',
            [$id]
        );
    }

    public function criar(string $nome, string $email, string $senhaHash, float $salario, string $moeda): int
    {
        Database::executar(
            'INSERT INTO usuarios (nome, email, senha, salario, moeda) VALUES (?, ?, ?, ?, ?)',
            [$nome, $email, $senhaHash, $salario, $moeda]
        );
        return Database::ultimoId();
    }

    public function atualizar(int $id, string $nome, float $salario, string $moeda, string $senhaHash): void
    {
        Database::executar(
            'UPDATE usuarios SET nome = ?, salario = ?, moeda = ?, senha = ? WHERE id = ?',
            [$nome, $salario, $moeda, $senhaHash, $id]
        );
    }
}
