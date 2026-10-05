<?php
/**
 * Erro com código HTTP. Lançado pelos controllers e transformado
 * em {"erro": "..."} pelo index.php.
 *
 * Ex.: throw new ErroHttp(404, 'Meta não encontrada.');
 */
class ErroHttp extends Exception
{
    public function __construct(public int $status, string $mensagem)
    {
        parent::__construct($mensagem);
    }
}
