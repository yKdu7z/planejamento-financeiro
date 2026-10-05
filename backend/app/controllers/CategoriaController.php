<?php
/**
 * Categorias de receitas e despesas (RF08).
 */
class CategoriaController
{
    private CategoriaModel $categorias;

    public function __construct()
    {
        $this->categorias = new CategoriaModel();
    }

    // Listar categorias do usuário (opcionalmente filtradas por tipo)
    public function listar(Request $req): Resposta
    {
        return Resposta::json($this->categorias->listar($req->usuarioId, $req->query['tipo'] ?? null));
    }
}
