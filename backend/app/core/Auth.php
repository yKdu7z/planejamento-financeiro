<?php

class Auth
{
    public static function iniciarSessao(): void
    {
        session_name('PFSESSID');
        session_set_cookie_params([
            'path' => '/',
            'httponly' => true, // o JavaScript não consegue ler o cookie
            'samesite' => 'Lax',
        ]);
        session_start();
    }

    public static function entrar(int $usuarioId): void
    {
        session_regenerate_id(true); // novo id de sessão a cada login
        $_SESSION['usuario_id'] = $usuarioId;
    }

    public static function sair(): void
    {
        $_SESSION = [];
        session_destroy();
    }

    public static function exigirUsuario(): int
    {
        if (empty($_SESSION['usuario_id'])) {
            throw new ErroHttp(401, 'Sua sessão expirou. Entre novamente.');
        }
        return (int) $_SESSION['usuario_id'];
    }
}
