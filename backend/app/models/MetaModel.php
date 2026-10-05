<?php
/**
 * Acesso às tabelas metas e aportes_meta.
 */
class MetaModel
{
    public function listar(int $usuarioId): array
    {
        return Database::todos('SELECT * FROM metas WHERE usuario_id = ? ORDER BY data_limite', [$usuarioId]);
    }

    public function buscar(int $id, int $usuarioId): ?array
    {
        return Database::um('SELECT * FROM metas WHERE id = ? AND usuario_id = ?', [$id, $usuarioId]);
    }

    public function criar(int $usuarioId, array $dados): int
    {
        Database::executar(
            'INSERT INTO metas (usuario_id, nome, valor_objetivo, valor_inicial, data_inicio, data_limite)
             VALUES (?, ?, ?, ?, ?, ?)',
            [$usuarioId, $dados['nome'], $dados['valor_objetivo'], $dados['valor_inicial'], $dados['data_inicio'], $dados['data_limite']]
        );
        return Database::ultimoId();
    }

    public function excluir(int $id, int $usuarioId): bool
    {
        return Database::executar('DELETE FROM metas WHERE id = ? AND usuario_id = ?', [$id, $usuarioId]) > 0;
    }

    // ---------- Aportes ----------

    public function totalAportes(int $metaId): float
    {
        $linha = Database::um('SELECT COALESCE(SUM(valor), 0) AS total FROM aportes_meta WHERE meta_id = ?', [$metaId]);
        return (float) $linha['total'];
    }

    public function criarAporte(int $metaId, float $valor, string $data): int
    {
        Database::executar('INSERT INTO aportes_meta (meta_id, valor, data) VALUES (?, ?, ?)', [$metaId, $valor, $data]);
        return Database::ultimoId();
    }
}
