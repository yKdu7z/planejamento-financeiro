<?php

class Database
{
    private static ?PDO $conexao = null;

    public static function conexao(): PDO
    {
        if (self::$conexao === null) {
            $config = (require __DIR__ . '/../config/config.php')['banco'];
            $dsn = "mysql:host={$config['host']};port={$config['porta']};dbname={$config['nome']};charset=utf8mb4";

            self::$conexao = new PDO($dsn, $config['usuario'], $config['senha'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false, // números inteiros voltam como int
            ]);
        }
        return self::$conexao;
    }

    /** Todas as linhas do resultado */
    public static function todos(string $sql, array $parametros = []): array
    {
        $stmt = self::conexao()->prepare($sql);
        $stmt->execute($parametros);
        return self::converterDecimais($stmt, $stmt->fetchAll());
    }

    /** Primeira linha do resultado, ou null */
    public static function um(string $sql, array $parametros = []): ?array
    {
        return self::todos($sql, $parametros)[0] ?? null;
    }

    /** INSERT / UPDATE / DELETE. Retorna quantas linhas foram afetadas. */
    public static function executar(string $sql, array $parametros = []): int
    {
        $stmt = self::conexao()->prepare($sql);
        $stmt->execute($parametros);
        return $stmt->rowCount();
    }

    public static function ultimoId(): int
    {
        return (int) self::conexao()->lastInsertId();
    }

    /**
     * O MySQL devolve colunas DECIMAL (dinheiro) como texto, ex.: "1400.00".
     * Aqui elas viram número para o JSON sair como 1400 e o front poder calcular.
     */
    private static function converterDecimais(PDOStatement $stmt, array $linhas): array
    {
        if (!$linhas) {
            return $linhas;
        }
        $decimais = [];
        for ($i = 0; $i < $stmt->columnCount(); $i++) {
            $meta = $stmt->getColumnMeta($i);
            if (in_array($meta['native_type'] ?? '', ['NEWDECIMAL', 'DECIMAL', 'DOUBLE', 'FLOAT'], true)) {
                $decimais[] = $meta['name'];
            }
        }
        foreach ($linhas as &$linha) {
            foreach ($decimais as $coluna) {
                if ($linha[$coluna] !== null) {
                    $linha[$coluna] = (float) $linha[$coluna];
                }
            }
        }
        return $linhas;
    }
}
