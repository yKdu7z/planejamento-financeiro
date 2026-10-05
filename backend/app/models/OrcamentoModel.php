<?php
class OrcamentoModel
{
    public function listarDoMes(int $usuarioId, int $mes, int $ano): array
    {
        return Database::todos(
            'SELECT o.*, c.nome AS categoria_nome
             FROM orcamentos o
             JOIN categorias c ON c.id = o.categoria_id
             WHERE o.usuario_id = ? AND o.mes = ? AND o.ano = ?',
            [$usuarioId, $mes, $ano]
        );
    }

    /** Retorna o id criado, ou null se já existe orçamento dessa categoria no mês */
    public function criar(int $usuarioId, int $categoriaId, int $mes, int $ano, float $limite): ?int
    {
        try {
            Database::executar(
                'INSERT INTO orcamentos (usuario_id, categoria_id, mes, ano, limite) VALUES (?, ?, ?, ?, ?)',
                [$usuarioId, $categoriaId, $mes, $ano, $limite]
            );
            return Database::ultimoId();
        } catch (PDOException $erro) {
            if (($erro->errorInfo[1] ?? null) === 1062) { // chave única duplicada
                return null;
            }
            throw $erro;
        }
    }

    public function excluir(int $id, int $usuarioId): bool
    {
        return Database::executar('DELETE FROM orcamentos WHERE id = ? AND usuario_id = ?', [$id, $usuarioId]) > 0;
    }
}
