// ================================
// CAMPOS
// ================================

const campoNome =
    document.getElementById("nome");

const campoTelefone =
    document.getElementById("telefone");

const campoArea =
    document.getElementById("areaAtuacao");

const campoDescricao =
    document.getElementById("descricao");

const contadorDescricao =
    document.getElementById("contadorDescricao");

const formulario =
    document.getElementById("voluntarioForm");


// ================================
// NOME
// ================================

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

campoTelefone.addEventListener("input", function () {

    this.value = this.value.replace(/\D/g, "");

    this.value = this.value.slice(0, 11);

});


// ================================
// ÁREA DE ATUAÇÃO
// ================================

campoArea.addEventListener("input", function () {

    this.value = this.value.replace(
        /[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g,
        ""
    );

    this.value = this.value.slice(0, 100);

});


// ================================
// DESCRIÇÃO
// ================================

campoDescricao.addEventListener("input", function () {

    this.value = this.value.slice(0, 500);

    contadorDescricao.textContent =
        `${this.value.length} / 500 caracteres`;

});


// ================================
// ENVIO DO FORMULÁRIO
// ================================

formulario.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const nome =
            campoNome.value.trim();

        const telefone =
            campoTelefone.value.trim();

        const areaAtuacao =
            campoArea.value.trim();

        const disponibilidade =
            document.getElementById(
                "disponibilidade"
            ).value;

        const descricao =
            campoDescricao.value.trim();


        // ================================
        // DADOS
        // ================================

        const voluntario = {

            nome,
            telefone,
            areaAtuacao,
            disponibilidade,
            descricao

        };


        try {

            const resposta = await fetch(
                "/api/voluntarios",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(
                        voluntario
                    )
                }
            );


            const resultado =
                await resposta.json();


            if (!resposta.ok) {

                throw new Error(
                    resultado.mensagem ||
                    "Erro ao cadastrar voluntário."
                );

            }


            // ================================
            // SUCESSO
            // ================================

            alert(
                "Cadastro realizado com sucesso!\n\n" +
                "Obrigado por fazer parte d'A REDE!"
            );


            formulario.reset();


            contadorDescricao.textContent =
                "0 / 500 caracteres";


        } catch (erro) {

            console.error(
                "Erro no cadastro:",
                erro
            );


            alert(
                "Não foi possível realizar o cadastro.\n\n" +
                "Verifique se o servidor está funcionando."
            );

        }

    }
);