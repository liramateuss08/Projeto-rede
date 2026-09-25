const modal = document.getElementById("modalCadastro");

// ================================
// ABRIR MODAL
// ================================

function abrirCadastro() {
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
}


// ================================
// FECHAR MODAL
// ================================

function fecharCadastro() {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
}


// ================================
// FECHAR CLICANDO FORA DO MODAL
// ================================

window.addEventListener("click", function (event) {

    if (event.target === modal) {
        fecharCadastro();
    }

});


// ================================
// SELECIONAR NECESSIDADE
// ================================

function selecionarNecessidade(necessidade) {

    abrirCadastro();

    document.getElementById("necessidade").value = necessidade;

}


// ================================
// VALIDAÇÕES DOS CAMPOS
// ================================


// NOME

const campoNome = document.getElementById("nome");

campoNome.addEventListener("input", function () {

    let nome = this.value.replace(
        /[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g,
        ""
    );

    nome = nome.toLowerCase();

    nome = nome.replace(
        /(^|\s)([a-zà-ÿ])/g,
        function (match, espaco, letra) {
            return espaco + letra.toUpperCase();
        }
    );

    this.value = nome.slice(0, 50);

});


// ================================
// TELEFONE
// ================================

const campoTelefone = document.getElementById("telefone");

campoTelefone.addEventListener("input", function () {

    this.value = this.value.replace(/\D/g, "");

    this.value = this.value.slice(0, 11);

});


// ================================
// PROFISSÃO
// ================================

const campoProfissao = document.getElementById("profissao");

campoProfissao.addEventListener("input", function () {

    this.value = this.value.replace(
        /[^A-Za-zÀ-ÖØ-öø-ÿ\s/]/g,
        ""
    );

    this.value = this.value.slice(0, 80);

});


// ================================
// EXPERIÊNCIA
// ================================

const campoExperiencia = document.getElementById("experiencia");

const contadorExperiencia = document.createElement("small");

contadorExperiencia.textContent = "0 / 500 caracteres";

contadorExperiencia.style.display = "block";

campoExperiencia.insertAdjacentElement(
    "afterend",
    contadorExperiencia
);


campoExperiencia.addEventListener("input", function () {

    this.value = this.value.slice(0, 500);

    contadorExperiencia.textContent =
        `${this.value.length} / 500 caracteres`;

});


// ================================
// ENVIO DO FORMULÁRIO
// ================================

const formulario = document.getElementById("cadastroForm");

formulario.addEventListener("submit", async function (event) {

    event.preventDefault();

    const nome =
        document.getElementById("nome").value;

    const telefone =
        document.getElementById("telefone").value;

    const necessidade =
        document.getElementById("necessidade").value;

    const profissao =
        document.getElementById("profissao").value;

    const experiencia =
        document.getElementById("experiencia").value;


    const pessoa = {

        nome,
        telefone,
        necessidade,
        profissao,
        experiencia

    };


    try {

        const resposta = await fetch(
            "/api/pessoas",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(pessoa)
            }
        );


        const resultado = await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.mensagem ||
                "Erro ao realizar cadastro."
            );

        }


        console.log(
            "Cadastro realizado:",
            resultado
        );


        alert(
            `Cadastro realizado com sucesso!\n\nPessoa: ${nome}\nNecessidade: ${necessidade}`
        );


        formulario.reset();

        contadorExperiencia.textContent =
            "0 / 500 caracteres";


        fecharCadastro();


    } catch (erro) {

        console.error(
            "Erro no cadastro:",
            erro
        );


        alert(
            "Não foi possível realizar o cadastro.\n\nVerifique se o servidor está funcionando."
        );

    }

});