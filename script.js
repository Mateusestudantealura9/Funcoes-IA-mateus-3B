// Elementos do DOM
const campoPergunta = document.getElementById("campo-pergunta");
const btnPerguntar = document.getElementById("btn-perguntar");
const tagsSugestoes = document.querySelectorAll(".tag");
const textoResposta = document.getElementById("texto-resposta");
const containerLink = document.getElementById("container-link");
const linkNoticia = document.getElementById("link-noticia");
const btnOuvir = document.getElementById("btn-ouvir");
const statusLoading = document.getElementById("status-loading");

// Configuração do Sintetizador de Voz (Web Speech API)
const synth = window.speechSynthesis;

// Função que realiza a consulta ao DuckDuckGo
async function buscarDuckDuckGo(termoBusca) {
    if (!termoBusca.trim()) {
        textoResposta.innerText = "Por favor, digite uma pergunta!";
        containerLink.style.display = "none";
        return;
    }

    statusLoading.style.display = "block";
    textoResposta.innerText = "";
    containerLink.style.display = "none";

    if (synth.speaking) {
        synth.cancel();
        btnOuvir.classList.remove("falando");
    }

    try {
        // API Instant Answer do DuckDuckGo
        const urlDuck = `https://api.duckduckgo.com/?q=${encodeURIComponent(termoBusca)}&format=json&kl=br-pt&no_html=1`;
        
        const resposta = await fetch(urlDuck);
        const dados = await resposta.json();

        // Verifica se o DuckDuckGo encontrou uma resposta direta ou tópicos relacionados
        let textoEncontrado = dados.AbstractText || dados.Definition;
        let urlFonte = dados.AbstractURL;

        if (!textoEncontrado && dados.RelatedTopics && dados.RelatedTopics.length > 0) {
            const primeiroTopico = dados.RelatedTopics.find(t => t.Text);
            if (primeiroTopico) {
                textoEncontrado = primeiroTopico.Text;
                urlFonte = primeiroTopico.FirstURL;
            }
        }

        // Se o DuckDuckGo retornar dados, exibe diretamente na página
        if (textoEncontrado) {
            textoResposta.innerText = textoEncontrado;
            if (urlFonte) {
                linkNoticia.href = urlFonte;
                containerLink.style.display = "flex";
            }
        } else {
            // Busca alternativa em caso de termo específico de jogos
            await buscarWikiFallback(termoBusca);
        }

    } catch (erro) {
        console.error("Erro no DuckDuckGo:", erro);
        await buscarWikiFallback(termoBusca);
    } finally {
        statusLoading.style.display = "none";
    }
}

// Fallback de busca ao vivo na Web para garantir resposta na tela
async function buscarWikiFallback(termoBusca) {
    try {
        const urlWiki = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termoBusca)}&format=json&origin=*`;
        const resWiki = await fetch(urlWiki);
        const dadosWiki = await resWiki.json();

        if (dadosWiki.query && dadosWiki.query.search.length > 0) {
            const pageId = dadosWiki.query.search[0].pageid;
            const urlExtrato = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&pageids=${pageId}&format=json&origin=*`;
            const resExtrato = await fetch(urlExtrato);
            const dadosExtrato = await resExtrato.json();

            let resumo = dadosExtrato.query.pages[pageId].extract;
            if (resumo.length > 400) resumo = resumo.substring(0, 400) + "...";

            textoResposta.innerText = resumo;
            linkNoticia.href = `https://pt.wikipedia.org/?curid=${pageId}`;
            containerLink.style.display = "flex";
        } else {
            textoResposta.innerText = `Nenhum resultado direto encontrado para "${termoBusca}". Tente pesquisar o nome exato de um jogo ou console.`;
        }
    } catch (e) {
        textoResposta.innerText = "Erro ao buscar informações na internet. Verifique sua conexão.";
    }
}

// Eventos de Clique e Teclado
btnPerguntar.addEventListener("click", () => {
    buscarDuckDuckGo(campoPergunta.value);
});

campoPergunta.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        buscarDuckDuckGo(campoPergunta.value);
    }
});

tagsSugestoes.forEach(tag => {
    tag.addEventListener("click", () => {
        const query = tag.getAttribute("data-query");
        campoPergunta.value = query;
        buscarDuckDuckGo(query);
    });
});

// Leitura de Voz I.A
btnOuvir.addEventListener("click", () => {
    if (!('speechSynthesis' in window)) {
        alert("Navegador não suporta a função de síntese de voz.");
        return;
    }

    if (synth.speaking) {
        synth.cancel();
        btnOuvir.classList.remove("falando");
        return;
    }

    const mensagem = textoResposta.innerText;
    if (!mensagem || statusLoading.style.display === "block") return;

    const utterance = new SpeechSynthesisUtterance(mensagem);
    utterance.lang = "pt-BR";
    utterance.rate = 1.0;

    utterance.onstart = () => {
        btnOuvir.classList.add("falando");
    };

    utterance.onend = () => {
        btnOuvir.classList.remove("falando");
    };

    utterance.onerror = () => {
        btnOuvir.classList.remove("falando");
    };

    synth.speak(utterance);
});

// Movimento 3D Hover do Card Modal
const modalContainer = document.querySelector('.modal-container');
document.addEventListener('mousemove', (e) => {
    const xAxis = (window.innerWidth / 2 - e.pageX) / 50;
    const yAxis = (window.innerHeight / 2 - e.pageY) / 50;
    modalContainer.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
});