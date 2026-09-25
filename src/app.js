require("dotenv").config();

const express = require("express");
const path = require("path");
const db = require("./database/db");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const app = express();

const PORT = 3000;

// ========================================
// CONFIGURAÇÕES
// ========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// SESSÃO ADMINISTRATIVA
// ========================================

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 1000 * 60 * 60
        }
    })
);

// ========================================
// FUNÇÃO DE PROTEÇÃO ADMINISTRATIVA
// ========================================

function exigirAdministrador(req, res, next) {

    if (!req.session.usuario) {
        return res.redirect("/admin.html");
    }

    if (req.session.usuario.perfil !== "ADMINISTRADOR") {
        return res.status(403).send("Acesso negado.");
    }

    next();
}

// ========================================
// LOGIN ADMINISTRATIVO
// ========================================

app.post("/api/admin/login", async (req, res) => {

    try {

        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "E-mail e senha são obrigatórios."
            });
        }

        const [usuarios] = await db.query(
            `
            SELECT
                usuarios.id,
                usuarios.email,
                usuarios.senha_hash,
                usuarios.status,
                perfis.nome AS perfil
            FROM usuarios
            INNER JOIN usuarios_perfis
                ON usuarios.id = usuarios_perfis.usuario_id
            INNER JOIN perfis
                ON usuarios_perfis.perfil_id = perfis.id
            WHERE usuarios.email = ?
              AND usuarios.status = 'ATIVO'
              AND perfis.nome = 'ADMINISTRADOR'
            LIMIT 1
            `,
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "E-mail ou senha inválidos."
            });
        }

        const usuario = usuarios[0];

        const senhaValida = await bcrypt.compare(
            senha,
            usuario.senha_hash
        );

        if (!senhaValida) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "E-mail ou senha inválidos."
            });
        }

        // Atualiza o último acesso

        await db.query(
            `
            UPDATE usuarios
            SET ultimo_acesso = NOW()
            WHERE id = ?
            `,
            [usuario.id]
        );

        // Cria a sessão do administrador

        req.session.usuario = {
            id: usuario.id,
            email: usuario.email,
            perfil: usuario.perfil
        };

        res.json({
            sucesso: true,
            mensagem: "Login realizado com sucesso!",
            usuario: {
                id: usuario.id,
                email: usuario.email,
                perfil: usuario.perfil
            }
        });

    } catch (erro) {

        console.error(
            "Erro no login administrativo:",
            erro
        );

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao realizar login."
        });
    }

});

// ========================================
// PROTEGER PAINEL ADMINISTRATIVO
// ========================================

app.get(
    "/admin-painel.html",
    exigirAdministrador,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "../public/admin-painel.html"
            )
        );

    }
);

// ========================================
// ARQUIVOS PÚBLICOS
// ========================================

app.use(
    express.static(
        path.join(__dirname, "../public")
    )
);

// ========================================
// ROTA PRINCIPAL
// ========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "../public/index.html"
        )
    );

});

// ========================================
// TESTAR BANCO DE DADOS
// ========================================

app.get("/api/teste-banco", async (req, res) => {

    try {

        const [resultado] = await db.query(
            "SELECT 1 AS conectado"
        );

        res.json({
            sucesso: true,
            mensagem: "Banco de dados conectado!",
            resultado
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao conectar ao banco de dados.",
            erro: erro.message
        });

    }

});

// ========================================
// CADASTRAR PESSOA
// ========================================

app.post("/api/pessoas", async (req, res) => {

    const conexao = await db.getConnection();

    try {

        const {
            nome,
            telefone,
            necessidade,
            profissao,
            experiencia
        } = req.body;

        if (!nome) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "O nome é obrigatório."
            });
        }

        await conexao.beginTransaction();

        // ========================================
        // 1. CADASTRAR PESSOA
        // ========================================

        const [pessoaResult] = await conexao.query(
            `
            INSERT INTO pessoas
            (nome, telefone)
            VALUES (?, ?)
            `,
            [
                nome,
                telefone || null
            ]
        );

        const pessoaId = pessoaResult.insertId;

        // ========================================
        // 2. CRIAR CASO
        // ========================================

        const [casoResult] = await conexao.query(
            `
            INSERT INTO casos
            (
                pessoa_id,
                titulo,
                descricao,
                status,
                prioridade
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                pessoaId,
                `Necessidade de ${nome}`,
                experiencia || null,
                "ABERTO",
                "MEDIA"
            ]
        );

        const casoId = casoResult.insertId;

        // ========================================
        // 3. REGISTRAR NECESSIDADE
        // ========================================

        if (necessidade) {

            const [categoriaResult] = await conexao.query(
                `
                SELECT id
                FROM categorias_necessidades
                WHERE nome = ?
                LIMIT 1
                `,
                [necessidade]
            );

            const categoriaId =
                categoriaResult.length > 0
                    ? categoriaResult[0].id
                    : null;

            await conexao.query(
                `
                INSERT INTO necessidades
                (
                    caso_id,
                    categoria,
                    titulo,
                    descricao,
                    status,
                    prioridade,
                    categoria_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    casoId,
                    necessidade,
                    `Necessidade de ${necessidade.toLowerCase()}`,
                    experiencia || null,
                    "PENDENTE",
                    "MEDIA",
                    categoriaId
                ]
            );

        }

        // ========================================
        // 4. REGISTRAR EXPERIÊNCIA
        // ========================================

        if (profissao) {

            await conexao.query(
                `
                INSERT INTO experiencias_profissionais
                (
                    pessoa_id,
                    cargo,
                    descricao
                )
                VALUES (?, ?, ?)
                `,
                [
                    pessoaId,
                    profissao,
                    experiencia || null
                ]
            );

        }

        // ========================================
        // FINALIZAR
        // ========================================

        await conexao.commit();

        res.status(201).json({
            sucesso: true,
            mensagem: "Cadastro realizado com sucesso!",
            pessoaId,
            casoId
        });

    } catch (erro) {

        await conexao.rollback();

        console.error(erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao cadastrar pessoa.",
            erro: erro.message
        });

    } finally {

        conexao.release();

    }

});

// ========================================
// LISTAR PEDIDOS / NECESSIDADES
// ========================================

app.get("/api/pedidos", async (req, res) => {

    try {

        const [pedidos] = await db.query(
            `
            SELECT
                casos.id AS caso_id,
                pessoas.id AS pessoa_id,
                pessoas.nome AS pessoa,
                pessoas.telefone,
                necessidades.id AS necessidade_id,
                necessidades.categoria,
                necessidades.titulo,
                necessidades.descricao,
                necessidades.status,
                necessidades.prioridade,
                necessidades.criado_em
            FROM necessidades
            INNER JOIN casos
                ON necessidades.caso_id = casos.id
            INNER JOIN pessoas
                ON casos.pessoa_id = pessoas.id
            ORDER BY necessidades.criado_em DESC
            `
        );

        res.json({
            sucesso: true,
            pedidos
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar pedidos.",
            erro: erro.message
        });

    }

});

// ========================================
// CADASTRAR VOLUNTÁRIO
// ========================================

app.post("/api/voluntarios", async (req, res) => {

    const conexao = await db.getConnection();

    try {

        const {
            nome,
            telefone,
            areaAtuacao,
            disponibilidade,
            descricao
        } = req.body;

        // ========================================
        // VALIDAÇÃO
        // ========================================

        if (
            !nome ||
            !telefone ||
            !areaAtuacao ||
            !disponibilidade
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Preencha todos os campos obrigatórios."
            });
        }

        await conexao.beginTransaction();

        // ========================================
        // 1. CADASTRAR PESSOA
        // ========================================

        const [pessoaResult] = await conexao.query(
            `
            INSERT INTO pessoas
            (nome, telefone)
            VALUES (?, ?)
            `,
            [
                nome,
                telefone
            ]
        );

        const pessoaId = pessoaResult.insertId;

        // ========================================
        // 2. CADASTRAR VOLUNTÁRIO
        // ========================================

        await conexao.query(
            `
            INSERT INTO voluntarios
            (
                pessoa_id,
                area_atuacao,
                disponibilidade,
                descricao,
                ativo
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                pessoaId,
                areaAtuacao,
                disponibilidade,
                descricao || null,
                1
            ]
        );

        await conexao.commit();

        res.status(201).json({
            sucesso: true,
            mensagem: "Voluntário cadastrado com sucesso!",
            pessoaId
        });

    } catch (erro) {

        await conexao.rollback();

        console.error(erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao cadastrar voluntário.",
            erro: erro.message
        });

    } finally {

        conexao.release();

    }

});

// ========================================
// LOGOUT ADMINISTRATIVO
// ========================================

app.post("/api/admin/logout", (req, res) => {

    req.session.destroy((erro) => {

        if (erro) {

            console.error(
                "Erro ao encerrar sessão:",
                erro
            );

            return res.status(500).json({
                sucesso: false,
                mensagem: "Erro ao sair da área administrativa."
            });

        }

        res.clearCookie("connect.sid");

        res.json({
            sucesso: true,
            mensagem: "Sessão encerrada com sucesso."
        });

    });

});

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {

    console.log(
        `Projeto Rede rodando em http://localhost:${PORT}`
    );

});