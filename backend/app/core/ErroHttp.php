<?php
class ErroHttp extends Exception
{
    public function __construct(public int $status, string $mensagem)
    {
        parent::__construct($mensagem);
    }
}
