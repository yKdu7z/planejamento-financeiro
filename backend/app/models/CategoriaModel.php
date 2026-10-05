<?php
/**
 * Acesso à tabela categorias.
 */
class CategoriaModel
{
    // Categorias criadas automaticamente para todo novo usuário
    private const PADRAO = [
        ['Salário', 'receita'],
        ['Freelance', 'receita'],
        ['Outras receitas', 'receita'],
        ['Alimentação', 'despesa'],
        ['Transporte', 'despesa'],
        ['Moradia', 'despesa'],
        ['Lazer', 'despesa'],
        ['Saúde', 'despesa'],
        ['Educação', 'despesa'],
        ['Outras despesas', 'despesa'],
    ];

    public function listar(int $usuarioId, ?string $tipo = null): array
    {
        if ($tipo) {
            return Database::todos(
                'SELECT * FROM categorias WHERE usuario_id = ? AND tipo = ? ORDER BY nome',
                [$usuarioId, $tipo]
            );
        }
        return Database::todos(
            'SELECT * FROM categorias WHERE usuario_id = ? ORDER BY tipo, nome',
            [$usuarioId]
        );
    }

    private function criar(int $usuarioId, string $nome, string $tipo): int
    {
        Database::executar(
            'INSERT INTO categorias (usuario_id, nome, tipo) VALUES (?, ?, ?)',
            [$usuarioId, $nome, $tipo]
        );
        return Database::ultimoId();
    }

    public function criarPadrao(int $usuarioId): void
    {
        foreach (self::PADRAO as [$nome, $tipo]) {
            $this->criar($usuarioId, $nome, $tipo);
        }
    }
}
