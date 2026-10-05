<?php
/**
 * Resposta HTTP em JSON devolvida pelos controllers.
 */
class Resposta
{
    private function __construct(private mixed $dados, private int $status)
    {
    }

    public static function json(mixed $dados, int $status = 200): self
    {
        return new self($dados, $status);
    }

    public function enviar(): void
    {
        http_response_code($this->status);
        echo json_encode($this->dados, JSON_UNESCAPED_UNICODE);
    }
}
