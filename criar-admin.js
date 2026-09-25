require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("./src/database/db");

async function criarAdministrador() {

    try {

        const nomeUsuario = "admin";
        const email = "admin@arede.local";
        const senha = process.env.ADMIN_PASSWORD;

        if (!senha) {

            throw new Error(
                "ADMIN_PASSWORD não foi definida no arquivo .env."
            );

        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const [resultado] = await db.query(
            `
            INSERT INTO usuarios
            (
                nome_usuario,
                email,
                senha_hash,
                status
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                nomeUsuario,
                email,
                senhaHash,
                "ATIVO"
            ]
        );

        const usuarioId = resultado.insertId;

        await db.query(
            `
            INSERT INTO usuarios_perfis
            (
                usuario_id,
                perfil_id
            )
            VALUES (?, ?)
            `,
            [
                usuarioId,
                1
            ]
        );

        console.log(
            "Administrador criado com sucesso!"
        );

        console.log(
            "ID:",
            usuarioId
        );

        console.log(
            "E-mail:",
            email
        );

    } catch (erro) {

        console.error(
            "Erro ao criar administrador:",
            erro
        );

    } finally {

        await db.end();

    }

}

criarAdministrador();