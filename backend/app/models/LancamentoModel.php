<?php

class LancamentoModel
{
    /** Histórico com filtros opcionais: data_inicio, data_fim, categoria_id, tipo */
    public function listar(int $usuarioId, array $filtros): array
    {
        $sql = 'SELECT l.*, c.nome AS categoria_nome
                FROM lancamentos l
                LEFT JOIN categorias c ON c.id = l.categoria_id
                WHERE l.usuario_id = ?';
        $parametros = [$usuarioId];

        if (!empty($filtros['data_inicio'])) {
            $sql .= ' AND l.data >= ?';
            $parametros[] = $filtros['data_inicio'];
        }
        if (!empty($filtros['data_fim'])) {
            $sql .= ' AND l.data <= ?';
            $parametros[] = $filtros['data_fim'];
        }
        if (!empty($filtros['categoria_id'])) {
            $sql .= ' AND l.categoria_id = ?';
            $parametros[] = $filtros['categoria_id'];
        }
        if (!empty($filtros['tipo'])) {
            $sql .= ' AND l.tipo = ?';
            $parametros[] = $filtros['tipo'];
        }
        $sql .= ' ORDER BY l.data DESC, l.id DESC';

        return Database::todos($sql, $parametros);
    }

    public function buscar(int $id, int $usuarioId): ?array
    {
        return Database::um('SELECT * FROM lancamentos WHERE id = ? AND usuario_id = ?', [$id, $usuarioId]);
    }

    public function criar(int $usuarioId, array $dados): int
    {
        Database::executar(
            'INSERT INTO lancamentos (usuario_id, categoria_id, descricao, valor, data, tipo)
             VALUES (?, ?, ?, ?, ?, ?)',
            [$usuarioId, $dados['categoria_id'], $dados['descricao'], $dados['valor'], $dados['data'], $dados['tipo']]
        );
        return Database::ultimoId();
    }

    public function atualizar(int $id, int $usuarioId, array $dados): void
    {
        Database::executar(
            'UPDATE lancamentos SET descricao = ?, valor = ?, data = ?, tipo = ?, categoria_id = ?
             WHERE id = ? AND usuario_id = ?',
            [$dados['descricao'], $dados['valor'], $dados['data'], $dados['tipo'], $dados['categoria_id'], $id, $usuarioId]
        );
    }

    public function excluir(int $id, int $usuarioId): bool
    {
        return Database::executar('DELETE FROM lancamentos WHERE id = ? AND usuario_id = ?', [$id, $usuarioId]) > 0;
    }

    // ---------- Totais e agrupamentos ----------

    /** ['receita' => total, 'despesa' => total] de todo o histórico, ou de um período */
    public function totaisPorTipo(int $usuarioId, string $inicio = '1000-01-01', string $fim = '9999-12-31'): array
    {
        $linhas = Database::todos(
            'SELECT tipo, COALESCE(SUM(valor), 0) AS total
             FROM lancamentos
             WHERE usuario_id = ? AND data BETWEEN ? AND ?
             GROUP BY tipo',
            [$usuarioId, $inicio, $fim]
        );
        return $this->separarPorTipo($linhas);
    }

    /** ['receita' => total, 'despesa' => total] de um mês */
    public function totaisPorTipoNoMes(int $usuarioId, int $mes, int $ano): array
    {
        $linhas = Database::todos(
            'SELECT tipo, COALESCE(SUM(valor), 0) AS total
             FROM lancamentos
             WHERE usuario_id = ? AND MONTH(data) = ? AND YEAR(data) = ?
             GROUP BY tipo',
            [$usuarioId, $mes, $ano]
        );
        return $this->separarPorTipo($linhas);
    }

    /** Despesas agrupadas por categoria, do maior para o menor gasto */
    public function despesasPorCategoria(int $usuarioId, string $inicio, string $fim): array
    {
        return Database::todos(
            "SELECT COALESCE(c.nome, 'Sem categoria') AS categoria, COALESCE(SUM(l.valor), 0) AS total
             FROM lancamentos l
             LEFT JOIN categorias c ON c.id = l.categoria_id
             WHERE l.usuario_id = ? AND l.tipo = 'despesa' AND l.data BETWEEN ? AND ?
             GROUP BY c.nome
             ORDER BY total DESC",
            [$usuarioId, $inicio, $fim]
        );
    }

    /** Receitas e despesas somadas mês a mês ('2026-10') */
    public function evolucaoMensal(int $usuarioId, string $inicio, string $fim): array
    {
        return Database::todos(
            "SELECT DATE_FORMAT(data, '%Y-%m') AS mes,
                    COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS receitas,
                    COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS despesas
             FROM lancamentos
             WHERE usuario_id = ? AND data BETWEEN ? AND ?
             GROUP BY mes
             ORDER BY mes",
            [$usuarioId, $inicio, $fim]
        );
    }

    /** Quanto foi gasto em uma categoria em um mês (usado pelos orçamentos) */
    public function gastoDaCategoriaNoMes(int $usuarioId, int $categoriaId, int $mes, int $ano): float
    {
        $linha = Database::um(
            "SELECT COALESCE(SUM(valor), 0) AS total
             FROM lancamentos
             WHERE usuario_id = ? AND categoria_id = ? AND tipo = 'despesa'
               AND MONTH(data) = ? AND YEAR(data) = ?",
            [$usuarioId, $categoriaId, $mes, $ano]
        );
        return (float) $linha['total'];
    }

    private function separarPorTipo(array $linhas): array
    {
        $totais = ['receita' => 0.0, 'despesa' => 0.0];
        foreach ($linhas as $linha) {
            $totais[$linha['tipo']] = (float) $linha['total'];
        }
        return $totais;
    }
}
