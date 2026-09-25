// ================================
// VARIÁVEIS
// ================================

let pedidos = [];

const listaPedidos = document.getElementById("listaPedidos");

const filtroCategoria =
    document.getElementById("filtroCategoria");

const filtroStatus =
    document.getElementById("filtroStatus");


// ================================
// CARREGAR PEDIDOS DA API
// ================================

async function carregarPedidos() {

    try {

        const resposta = await fetch("/api/pedidos");

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            throw new Error("Erro ao carregar pedidos.");
        }

        pedidos = resultado.pedidos;

        mostrarPedidos();

    } catch (erro) {

        console.error(erro);

        listaPedidos.innerHTML = `
            <p>
                Não foi possível carregar as necessidades.
            </p>
        `;
    }
}


// ================================
// MOSTRAR PEDIDOS
// ================================

function mostrarPedidos() {

    const categoriaSelecionada =
        filtroCategoria.value;

    const statusSelecionado =
        filtroStatus.value;


    const pedidosFiltrados = pedidos.filter(pedido => {

        const categoriaOK =
            !categoriaSelecionada ||
            pedido.categoria === categoriaSelecionada;

        const statusOK =
            !statusSelecionado ||
            pedido.status === statusSelecionado;

        return categoriaOK && statusOK;

    });


    if (pedidosFiltrados.length === 0) {

        listaPedidos.innerHTML = `
            <div class="nenhum-pedido">
                <h3>Nenhuma necessidade encontrada</h3>

                <p>
                    Não existem pedidos para os filtros selecionados.
                </p>
            </div>
        `;

        return;
    }


    listaPedidos.innerHTML = "";


    pedidosFiltrados.forEach(pedido => {

        const card = document.createElement("div");

        card.className = "card-pedido";


        card.innerHTML = `

            <div class="pedido-topo">

                <span class="categoria">
                    ${formatarCategoria(pedido.categoria)}
                </span>

                <span class="prioridade ${pedido.prioridade.toLowerCase()}">
                    ${formatarPrioridade(pedido.prioridade)}
                </span>

            </div>


            <h2>
                ${pedido.titulo}
            </h2>


            <p class="descricao">
                ${pedido.descricao || "Nenhuma descrição informada."}
            </p>


            <div class="pedido-pessoa">

                <strong>
                    Pessoa:
                </strong>

                ${pedido.pessoa}

            </div>


            <div class="pedido-status">

                <span class="status ${pedido.status.toLowerCase()}">
                    ${formatarStatus(pedido.status)}
                </span>

            </div>


            <button
                class="btn-detalhes"
                onclick="abrirPedido(${pedido.necessidade_id})">

                Ver detalhes

            </button>

        `;


        listaPedidos.appendChild(card);

    });

}


// ================================
// FORMATAR CATEGORIA
// ================================

function formatarCategoria(categoria) {

    const categorias = {

        DOCUMENTAÇÃO: "Documentação",
        SAÚDE: "Saúde",
        EDUCAÇÃO: "Educação",
        EMPREGO: "Emprego",
        MORADIA: "Moradia",
        ALIMENTAÇÃO: "Alimentação",
        "ASSISTÊNCIA SOCIAL": "Assistência Social",
        JURÍDICO: "Jurídico",
        PSICOLÓGICO: "Psicológico",
        TRANSPORTE: "Transporte"

    };

    return categorias[categoria] || categoria;

}


// ================================
// FORMATAR PRIORIDADE
// ================================

function formatarPrioridade(prioridade) {

    const prioridades = {

        BAIXA: "Baixa",

        MEDIA: "Média",

        ALTA: "Alta"

    };

    return prioridades[prioridade] || prioridade;

}


// ================================
// FORMATAR STATUS
// ================================

function formatarStatus(status) {

    const statusTexto = {

        PENDENTE: "Aguardando atendimento",

        EM_ANDAMENTO: "Em andamento",

        CONCLUIDO: "Concluído",

        CANCELADO: "Cancelado"

    };

    return statusTexto[status] || status;

}


// ================================
// ABRIR DETALHES
// ================================

function abrirPedido(id) {

    const pedido =
        pedidos.find(item =>
            item.necessidade_id === id
        );


    if (!pedido) {
        return;
    }


    document.getElementById("modalTitulo").textContent =
        pedido.titulo;


    document.getElementById("modalInformacoes").innerHTML = `

        <p>
            <strong>Pessoa:</strong>
            ${pedido.pessoa}
        </p>

        <p>
            <strong>Telefone:</strong>
            ${pedido.telefone || "Não informado"}
        </p>

        <p>
            <strong>Necessidade:</strong>
            ${formatarCategoria(pedido.categoria)}
        </p>

        <p>
            <strong>Descrição:</strong>
            ${pedido.descricao || "Não informada"}
        </p>

        <p>
            <strong>Prioridade:</strong>
            ${formatarPrioridade(pedido.prioridade)}
        </p>

        <p>
            <strong>Status:</strong>
            ${formatarStatus(pedido.status)}
        </p>

    `;


    document.getElementById("modalPedido").style.display =
        "flex";

}


// ================================
// FECHAR DETALHES
// ================================

function fecharPedido() {

    document.getElementById("modalPedido").style.display =
        "none";

}


// ================================
// FECHAR CLICANDO FORA
// ================================

window.addEventListener("click", function (event) {

    const modal =
        document.getElementById("modalPedido");


    if (event.target === modal) {

        fecharPedido();

    }

});


// ================================
// FILTROS
// ================================

filtroCategoria.addEventListener(
    "change",
    mostrarPedidos
);

filtroStatus.addEventListener(
    "change",
    mostrarPedidos
);


// ================================
// INICIAR
// ================================

carregarPedidos();