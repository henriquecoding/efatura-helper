/* Mesa Fiscal - fixtures. Data only: journeys, acts, copy and the coverage manifest.
 *
 * CONTRACT (test-demo-contract.js):
 *   - no network, no DOM, no storage, no real data, no fiscal computation;
 *   - every value here is illustrative and structural (round numbers, masked NIF, fictional
 *     merchant names); nothing is read from the person or from tool.js;
 *   - the last act of every journey is static (dwellMs 0) and the journey NEVER loops;
 *   - while DRAFT=true the classification journey ends in a PLAN, never a submission;
 *   - coverage states come from a fixed enum and are sourced from COVERAGE.md + the homepage
 *     ledger, resolved conservatively - a reader existing is NOT "validated".
 *
 * Loaded in the browser as window.FB_DEMO_FIXTURES and in Node via module.exports.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.FB_DEMO_FIXTURES = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var deepFreeze = function (o) {
    Object.getOwnPropertyNames(o).forEach(function (k) {
      if (o[k] && typeof o[k] === "object") deepFreeze(o[k]);
    });
    return Object.freeze(o);
  };

  /* Coverage manifest for the nine profile sources. States allowed:
   *   validated        - published as validated on the homepage ledger AND consistent with COVERAGE.md
   *   development      - published as in development
   *   coverage-unknown - a reader exists but no conclusive public record; the conservative state
   * "success/done/safe/accurate" are deliberately not in the vocabulary. */
  var COVERAGE = [
    { id: "efatura", label: "e-Fatura", status: "validated", statusLabel: "Validado em casos reais" },
    { id: "rendas", label: "Rendas", status: "validated", statusLabel: "Validado em casos reais" },
    { id: "situacao", label: "Situação fiscal", status: "validated", statusLabel: "Validado em casos reais" },
    { id: "atividade", label: "Atividade e IVA", status: "development", statusLabel: "Em desenvolvimento · confirma" },
    { id: "irs", label: "IRS", status: "validated", statusLabel: "Validado em casos reais" },
    { id: "movimentos", label: "Movimentos financeiros", status: "coverage-unknown", statusLabel: "Leitor disponível · cobertura por confirmar" },
    { id: "recibos", label: "Recibos verdes", status: "development", statusLabel: "Em desenvolvimento · confirma" },
    { id: "ss", label: "Segurança Social", status: "coverage-unknown", statusLabel: "Leitor disponível · cobertura por confirmar" },
    { id: "patrimonio", label: "Património e IMI", status: "validated", statusLabel: "Validado em casos reais" }
  ];

  /* Item kinds a scene can render (all structural):
   *   row    { icon, text, state? }      a line that appears
   *   kv     { k, v }                    a label/value pair
   *   field  { label, value, typed? }    a simulated input; typed derives from act progress
   *   bar    { label, note, fill }       a ceiling bar, scaleX'd to `fill`
   *   badge  { text, tone? }             a persistent stamp (e.g. DRAFT)
   *   note   { text, tone? }             a short callout                                   */
  var J = [];

  /* ---------------------------------------------------- 1. Consultar empresa */
  J.push({
    id: "empresa", group: "ferramentas", tabLabel: "Empresa",
    title: "Consultar uma empresa",
    summary: "Do modo de pesquisa ao dossiê com fontes.",
    icon: "fb-empresa", href: "/#empresa-form", ctaLabel: "Abrir consulta de empresa",
    fixtureKind: "illustrative",
    acts: [
      { id: "modo", label: "Modo", ariaLabel: "Escolher pesquisa por NIF", dwellMs: 2800,
        say: "Escolhe primeiro o dado que tens.",
        pointer: [
          { at: 0.00, x: 0.86, y: 0.10, opacity: 0 },
          { at: 0.14, x: 0.62, y: 0.24, opacity: 1 },
          { at: 0.34, x: 0.22, y: 0.30, opacity: 1 },
          { at: 0.40, x: 0.22, y: 0.30, opacity: 1, pressed: true },
          { at: 0.52, x: 0.22, y: 0.30, opacity: 0 }
        ],
        items: [
          { kind: "field", label: "Procurar por", value: "NIF · Nome", typed: false },
          { kind: "note", text: "O modo escolhido define a validação e a ajuda." }
        ] },
      { id: "escrever", label: "Escrever", ariaLabel: "Escrever o NIF mascarado", dwellMs: 3400,
        say: "O valor não entra no URL nem no histórico desta página.",
        items: [
          { kind: "field", label: "NIF da empresa", value: "5•• ••• •••", typed: true },
          { kind: "note", text: "Nove dígitos. Espaços são ignorados." }
        ] },
      { id: "validar", label: "Validar", ariaLabel: "Validação local antes do pedido", dwellMs: 2600,
        say: "A validação acontece antes do pedido.",
        items: [
          { kind: "field", label: "NIF da empresa", value: "5•• ••• •••", typed: false },
          { kind: "row", icon: "fb-check", text: "Formato confirmado no navegador", state: "ok" }
        ] },
      { id: "fontes", label: "Fontes", ariaLabel: "Consulta às fontes públicas", dwellMs: 3600,
        say: "Só agora é feita uma consulta pública.",
        items: [
          { kind: "row", icon: "fb-empresa", text: "SICAE — empresas e CAE", state: "ok" },
          { kind: "row", icon: "fb-percentagem", text: "VIES — situação de IVA", state: "ok" },
          { kind: "row", icon: "fb-banco", text: "BASE — contratos públicos", state: "ok" }
        ] },
      { id: "dossie", label: "Dossiê", ariaLabel: "Ler o dossiê da empresa", dwellMs: 4600,
        say: "O CAE mostra o que a empresa pode exercer; não prova o que foi comprado.",
        items: [
          { kind: "kv", k: "Nome oficial", v: "Empresa de exemplo, Lda." },
          { kind: "kv", k: "NIF", v: "5•• ••• •••" },
          { kind: "kv", k: "CAE principal", v: "47110 · Comércio a retalho" },
          { kind: "kv", k: "Situação de IVA", v: "Ativo" },
          { kind: "kv", k: "Contratos públicos", v: "Sem registos em 12 meses" }
        ] },
      { id: "proximo", label: "Próximo", ariaLabel: "Percurso completo", dwellMs: 0,
        say: "Percurso completo. A pesquisa real está no topo desta página.",
        items: [
          { kind: "row", icon: "fb-check", text: "Nada foi pedido a nenhum servidor nesta encenação.", state: "ok" }
        ] }
    ]
  });

  /* ---------------------------------------------------- 2. Instalar o favorito */
  J.push({
    id: "instalar", group: "confianca", tabLabel: "Instalar",
    title: "Instalar o favorito",
    summary: "Guardar uma vez; correr na sessão que já abriste.",
    icon: "fb-marcador", href: "/perfil#instalar", ctaLabel: "Ver como instalar",
    fixtureKind: "illustrative",
    acts: [
      { id: "guardar", label: "Guardar", ariaLabel: "Guardar o favorito uma vez", dwellMs: 3400,
        say: "Guarda uma vez no teu navegador.",
        items: [
          { kind: "row", icon: "fb-marcador", text: "Fatura Boa — Situação → barra de favoritos" },
          { kind: "note", text: "Nunca colar na barra de endereço; guardar como favorito." }
        ] },
      { id: "oficial", label: "Oficial", ariaLabel: "Abrir a página oficial", dwellMs: 3400,
        say: "Inicia sessão apenas na página oficial.",
        items: [
          { kind: "field", label: "Endereço (representação)", value: "portaldasfinancas.gov.pt", typed: false },
          { kind: "row", icon: "fb-cadeado", text: "A sessão é aberta por ti, no domínio oficial." }
        ] },
      { id: "clicar", label: "Clicar", ariaLabel: "Clicar no favorito na página oficial", dwellMs: 2800,
        say: "A ferramenta corre na sessão que já abriste.",
        items: [
          { kind: "row", icon: "fb-marcador", text: "Clique no favorito — nada toca em campos de password", state: "ok" }
        ] },
      { id: "consentir", label: "Consentir", ariaLabel: "Consentimento antes de qualquer leitura", dwellMs: 4200,
        say: "Zero pedidos antes de aceitares.",
        items: [
          { kind: "row", icon: "fb-escudo", text: "O painel enumera o que vai ser lido" },
          { kind: "row", icon: "fb-circulo", text: "Nenhuma opção vem pré-selecionada" },
          { kind: "badge", text: "Antes do consentimento: 0 pedidos de rede", tone: "ok" }
        ] },
      { id: "ler", label: "Ler", ariaLabel: "Leitura da página aberta", dwellMs: 3800,
        say: "Só lê a fonte aberta. Não submete nada.",
        items: [
          { kind: "row", icon: "fb-check", text: "e-Fatura — lida nesta sessão", state: "ok" },
          { kind: "row", icon: "fb-circulo", text: "Restantes fontes — quando as abrires" }
        ] },
      { id: "pronto", label: "Pronto", ariaLabel: "Instalação explicada", dwellMs: 0,
        say: "Há também uma instalação verificada (SRI) em /verificar.",
        items: [
          { kind: "row", icon: "fb-check", text: "Nenhum código foi executado nesta encenação.", state: "ok" }
        ] }
    ]
  });

  /* ---------------------------------------------------- 3. A minha situação */
  J.push({
    id: "situacao", group: "ferramentas", tabLabel: "Situação",
    title: "A minha situação",
    summary: "Nove fontes oficiais, combinadas no teu navegador.",
    icon: "fb-situacao", href: "/perfil", ctaLabel: "Abrir A minha situação",
    fixtureKind: "illustrative",
    acts: [
      { id: "consentir", label: "Consentir", ariaLabel: "Consentimento antes da leitura", dwellMs: 4000,
        say: "Tu decides antes de qualquer leitura.",
        items: [
          { kind: "row", icon: "fb-escudo", text: "Categorias de dados enumeradas, nenhuma pré-selecionada" }
        ] },
      { id: "fontes", label: "Fontes", ariaLabel: "As nove fontes e o seu estado de cobertura", dwellMs: 4600,
        say: "Cada área oficial é uma etapa separada — com o estado de cobertura à vista.",
        coverage: true },
      { id: "ler", label: "Ler", ariaLabel: "Ler uma fonte na sessão oficial", dwellMs: 4000,
        say: "O favorito lê a página onde já tens sessão.",
        items: [
          { kind: "row", icon: "fb-check", text: "e-Fatura — lida nesta sessão", state: "ok" },
          { kind: "kv", k: "Faturas (exemplo)", v: "100 · 3 por classificar" }
        ] },
      { id: "passar", label: "Passar", ariaLabel: "Regresso por fragmento local", dwellMs: 3800,
        say: "O fragmento não é enviado ao servidor.",
        items: [
          { kind: "field", label: "Regresso (representação)", value: "/perfil#…resumo-local…", typed: false },
          { kind: "note", text: "Tudo depois de # fica no navegador; é lido e apagado." }
        ] },
      { id: "combinar", label: "Combinar", ariaLabel: "Combinar as fontes num resumo", dwellMs: 4600,
        say: "O perfil é combinado no teu navegador.",
        items: [
          { kind: "row", icon: "fb-documento", text: "e-Fatura + Rendas + IRS → um resumo local" },
          { kind: "badge", text: "Exemplo · dados ilustrativos", tone: "muted" }
        ] },
      { id: "agir", label: "Agir", ariaLabel: "Indicadores para confirmar", dwellMs: 4200,
        say: "Indicadores para confirmares, nunca aconselhamento.",
        items: [
          { kind: "kv", k: "Faturas por classificar", v: "3 (exemplo)" },
          { kind: "kv", k: "Próximo prazo (exemplo)", v: "30 JUN · entrega do IRS" }
        ] },
      { id: "apagar", label: "Apagar", ariaLabel: "Expiração e apagar dados", dwellMs: 0,
        say: "Apagado no fim do dia ou quando escolheres.",
        items: [
          { kind: "row", icon: "fb-lixo", text: "“Apagar os meus dados” — com confirmação", state: "ok" }
        ] }
    ]
  });

  /* ---------------------------------------------------- 4. Classificar faturas */
  J.push({
    id: "classificar", group: "ferramentas", tabLabel: "Classificar",
    title: "Classificar faturas",
    summary: "Da sugestão ao plano — nada é submetido.",
    icon: "fb-deducoes", href: "/perfil#instalar", ctaLabel: "Instalar a ferramenta",
    fixtureKind: "illustrative",
    acts: [
      { id: "ler", label: "Ler", ariaLabel: "Faturas pendentes de exemplo", dwellMs: 3800,
        say: "Faturas pendentes encontradas nesta encenação.",
        items: [
          { kind: "row", icon: "fb-documento", text: "Mercearia Exemplo — 20,00 €" },
          { kind: "row", icon: "fb-documento", text: "Farmácia Fictícia — 15,00 €" },
          { kind: "row", icon: "fb-documento", text: "Restaurante Imaginário — 30,00 €" }
        ] },
      { id: "historico", label: "Histórico", ariaLabel: "Sugestão pelo histórico", dwellMs: 4000,
        say: "A primeira pista vem de classificações anteriores.",
        items: [
          { kind: "kv", k: "Mercearia Exemplo", v: "Despesas gerais · o teu histórico" }
        ] },
      { id: "cae", label: "CAE", ariaLabel: "Sugestão pela atividade pública", dwellMs: 4200,
        say: "O CAE ajuda, mas não prova o que compraste.",
        items: [
          { kind: "kv", k: "Farmácia Fictícia", v: "Saúde · atividade pública da empresa" },
          { kind: "note", text: "Ser aceite pelo e-Fatura não significa estar certo. Quem declara és tu.", tone: "warn" }
        ] },
      { id: "comparar", label: "Comparar", ariaLabel: "Provável contra otimizada e tetos", dwellMs: 4600,
        say: "Otimizada respeita o espaço disponível; não muda a verdade da compra.",
        items: [
          { kind: "bar", label: "Saúde", note: "620 € de 1.000 €", fill: 0.62 },
          { kind: "bar", label: "IVA por setor (conjunto)", note: "145 € de 250 €", fill: 0.58 }
        ] },
      { id: "rever", label: "Rever", ariaLabel: "Rever cada escolha", dwellMs: 4000,
        say: "Tu revês cada escolha.",
        items: [
          { kind: "row", icon: "fb-check", text: "3 escolhas revistas uma a uma", state: "ok" }
        ] },
      { id: "plano", label: "Plano", ariaLabel: "Plano pronto, nada submetido", dwellMs: 0,
        say: "Plano pronto para rever. Nada foi submetido às Finanças — abre o e-Fatura e faz tu as alterações que confirmares.",
        items: [
          { kind: "badge", text: "DRAFT · a ferramenta lê, nunca submete", tone: "ok" }
        ] }
    ]
  });

  /* ---------------------------------------------------- 5. Deduções */
  J.push({
    id: "deducoes", group: "ferramentas", tabLabel: "Deduções",
    title: "Explorar deduções",
    summary: "Ano, regra, fonte e estado de verificação.",
    icon: "fb-percentagem", href: "/deducoes", ctaLabel: "Abrir deduções",
    fixtureKind: "illustrative",
    acts: [
      { id: "ano", label: "Ano", ariaLabel: "Só anos com dados", dwellMs: 2800,
        say: "Um ano sem dados não aparece como zero.",
        items: [
          { kind: "field", label: "Ano fiscal", value: "2026 · 2025 · 2024 · 2023", typed: false }
        ] },
      { id: "procurar", label: "Procurar", ariaLabel: "Pesquisar no índice carregado", dwellMs: 3400,
        say: "A pesquisa corre sobre o índice carregado.",
        items: [
          { kind: "field", label: "Setor ou despesa", value: "rendas", typed: true }
        ] },
      { id: "regra", label: "Regra", ariaLabel: "A regra com fonte", dwellMs: 4400,
        say: "Números vêm dos artefactos auditados.",
        items: [
          { kind: "kv", k: "Habitação · rendas", v: "15% até 900 € (2026)" },
          { kind: "kv", k: "Base legal", v: "art. 78.º-E · DL 97/2026" }
        ] },
      { id: "estado", label: "Estado", ariaLabel: "Conferido contra por confirmar", dwellMs: 3800,
        say: "Ausência de confirmação nunca fica verde.",
        items: [
          { kind: "row", icon: "fb-check", text: "Conferido na fonte — artigo relido no DRE", state: "ok" },
          { kind: "row", icon: "fb-circulo", text: "Por confirmar — sem prova, sem verde", state: "muted" }
        ] },
      { id: "fonte", label: "Fonte", ariaLabel: "Abrir a fonte oficial", dwellMs: 3600,
        say: "Podes verificar a regra e o código.",
        items: [
          { kind: "row", icon: "fb-externo", text: "Diário da República — artigo oficial" },
          { kind: "row", icon: "fb-lista", text: "/auditoria — a matriz gerada do código" }
        ] },
      { id: "pessoal", label: "Pessoal", ariaLabel: "Vista pessoal ainda bloqueada", dwellMs: 0,
        say: "A vista pessoal fica bloqueada até carregares a tua situação — e não mostra números de exemplo no lugar dos teus.",
        items: [
          { kind: "row", icon: "fb-cadeado", text: "A minha utilização · bloqueada sem perfil local", state: "muted" }
        ] }
    ]
  });

  /* ---------------------------------------------------- 6. Base legal */
  J.push({
    id: "legal", group: "ferramentas", tabLabel: "Base legal",
    title: "Confirmar a regra",
    summary: "Três artefactos juntos; nada é inventado.",
    icon: "fb-legal", href: "/base-legal", ctaLabel: "Abrir base legal",
    fixtureKind: "illustrative",
    acts: [
      { id: "tema", label: "Tema", ariaLabel: "Começar pelo assunto", dwellMs: 3000,
        say: "Começa pelo assunto.",
        items: [
          { kind: "row", icon: "fb-situacao", text: "Deduções do IRS" },
          { kind: "row", icon: "fb-casa", text: "Rendas e habitação" },
          { kind: "row", icon: "fb-calendario", text: "Prazos e correções" }
        ] },
      { id: "filtrar", label: "Filtrar", ariaLabel: "Filtros no navegador", dwellMs: 3400,
        say: "Filtros correm no navegador.",
        items: [
          { kind: "field", label: "Diploma · Ano", value: "CIRS · 2026", typed: false }
        ] },
      { id: "juntar", label: "Juntar", ariaLabel: "A junção dos três artefactos", dwellMs: 4400,
        say: "A regra resulta da junção, não de texto inventado.",
        items: [
          { kind: "row", icon: "fb-pasta", text: "legal_sources — a fonte oficial" },
          { kind: "row", icon: "fb-codigo", text: "audit-manifest — o que o código aplica" },
          { kind: "row", icon: "fb-calendario", text: "audit-freshness — a última leitura" }
        ] },
      { id: "estado", label: "Estado", ariaLabel: "Estados possíveis de uma regra", dwellMs: 4000,
        say: "O estado é uma palavra e um símbolo, não só cor.",
        items: [
          { kind: "row", icon: "fb-check", text: "Conferido na fonte", state: "ok" },
          { kind: "row", icon: "fb-aviso", text: "Mudou — precisa de revisão", state: "warn" },
          { kind: "row", icon: "fb-circulo", text: "Por confirmar", state: "muted" }
        ] },
      { id: "prova", label: "Prova", ariaLabel: "Abrir a prova", dwellMs: 0,
        say: "Cada ficha liga à fonte oficial e à matriz gerada.",
        items: [
          { kind: "row", icon: "fb-externo", text: "Abrir fonte oficial · Ver na matriz", state: "ok" }
        ] }
    ]
  });

  /* ---------------------------------------------------- 7. Verificar */
  J.push({
    id: "verificar", group: "confianca", tabLabel: "Verificar",
    title: "Verificar o código",
    summary: "O ficheiro servido contra o publicado.",
    icon: "fb-escudo", href: "/verificar", ctaLabel: "Verificar agora",
    fixtureKind: "illustrative",
    acts: [
      { id: "ficheiro", label: "Ficheiro", ariaLabel: "O ficheiro servido", dwellMs: 3200,
        say: "É o ficheiro servido.",
        items: [
          { kind: "kv", k: "Servido", v: "/tool.js" }
        ] },
      { id: "resumo", label: "Resumo", ariaLabel: "A impressão digital", dwellMs: 4000,
        say: "O resumo muda se um byte mudar.",
        items: [
          { kind: "kv", k: "SHA-384 (mascarado)", v: "sha384-••••••••abcd" }
        ] },
      { id: "publicado", label: "Publicado", ariaLabel: "O valor publicado", dwellMs: 3600,
        say: "É o valor publicado para esta versão.",
        items: [
          { kind: "kv", k: "versions.json", v: "sha384-••••••••abcd" }
        ] },
      { id: "comparar", label: "Comparar", ariaLabel: "Comparação dos dois valores", dwellMs: 3400,
        say: "Correspondem nesta encenação.",
        items: [
          { kind: "row", icon: "fb-check", text: "O ficheiro servido corresponde ao publicado.", state: "ok" },
          { kind: "note", text: "Só /verificar calcula de verdade — isto é uma representação." }
        ] },
      { id: "resultado", label: "Resultado", ariaLabel: "Verificar a sério", dwellMs: 0,
        say: "A verificação real corre no teu navegador, em /verificar.",
        items: [
          { kind: "row", icon: "fb-escudo", text: "Também há um favorito SRI que recusa código trocado.", state: "ok" }
        ] }
    ]
  });

  return deepFreeze({
    version: 1,
    disclosure: "Exemplo com dados ilustrativos. Não é a situação de ninguém e não foi feito qualquer pedido real.",
    coverage: COVERAGE,
    journeys: J
  });
});
