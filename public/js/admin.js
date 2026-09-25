const formulario = document.getElementById("adminLoginForm");
const mensagem = document.getElementById("mensagemLogin");

formulario.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    mensagem.textContent = "Verificando acesso...";
    mensagem.style.color = "#6b7280";

    try {

        const resposta = await fetch("/api/admin/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                senha
            })

        });

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {

            mensagem.textContent =
                resultado.mensagem ||
                "Não foi possível realizar o login.";

            mensagem.style.color = "#b91c1c";

            return;
        }

        mensagem.textContent =
        "Login realizado com sucesso!";
        mensagem.style.color = "#176b45";
        setTimeout(() => {
            window.location.href = "admin-painel.html";
        }, 500);

    } catch (erro) {

        console.error(erro);

        mensagem.textContent =
            "Não foi possível conectar ao servidor.";

        mensagem.style.color = "#b91c1c";

    }

});