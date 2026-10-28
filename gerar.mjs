// Gera as páginas do site. Edite o conteúdo aqui e rode `node gerar.mjs`; o HTML gerado é o que o Pages publica.
import { mkdirSync, writeFileSync } from 'node:fs';

// Endereço público do site. Ao trocar para juntas.app.br, mude aqui e o <base> do 404.
const SITE = 'https://cainant.github.io/juntas-site/';
const EMAIL = 'ctravizanutto@gmail.com';
const PAGINAS = [];
const mail = (assunto) =>
  `<a href="mailto:${EMAIL}${assunto ? `?subject=${encodeURIComponent(assunto)}` : ''}">${EMAIL}</a>`;

const NAV = [
  ['#recursos', 'Recursos'],
  ['#bia', 'Bia'],
  ['#para-quem', 'Para quem'],
  ['#perguntas', 'Perguntas'],
  ['contato/', 'Suporte'],
];

function pagina({ arquivo, raiz, titulo, descricao, atual, corpo, base = '', caminho }) {
  if (caminho !== undefined) {
    PAGINAS.push(caminho);
  }
  const og =
    caminho === undefined
      ? '\n  <meta name="robots" content="noindex">'
      : `
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Juntas">
  <meta property="og:title" content="${titulo}">
  <meta property="og:description" content="${descricao}">
  <meta property="og:url" content="${SITE}${caminho}">
  <meta property="og:image" content="${SITE}assets/og.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">`;
  const nav = NAV.map(
    ([href, rotulo]) =>
      `<li><a href="${raiz}${href}"${atual === href ? ' aria-current="page"' : ''}>${rotulo}</a></li>`,
  ).join('\n            ');
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${titulo}</title>
  <meta name="description" content="${descricao}">
  <meta name="theme-color" content="#f9f5f1">${base}${og}
  <link rel="icon" href="${raiz}assets/favicon.png" type="image/png">
  <link rel="icon" href="${raiz}assets/icone.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="${raiz}assets/apple-touch-icon.png">
  <link rel="preload" href="${raiz}assets/fonts/fraunces.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${raiz}assets/site.css">
</head>
<body>
  <a class="pular" href="#conteudo">Pular para o conteúdo</a>
  <header class="topo">
    <div class="container topo-in">
      <a class="marca" href="${raiz || './'}"><img src="${raiz}assets/icone.svg" alt="" width="36" height="36">Juntas</a>
      <nav aria-label="Principal">
        <ul>
            ${nav}
        </ul>
      </nav>
      <a class="btn btn-sm" href="${raiz}#baixar">Baixar o app</a>
    </div>
  </header>

  <main id="conteudo">
${corpo}
  </main>

  <footer class="rodape">
    <div class="container">
      <div class="rodape-in">
        <div>
          <a class="marca" href="${raiz || './'}"><img src="${raiz}assets/icone.svg" alt="" width="36" height="36">Juntas</a>
          <p>A gestante, a profissional de saúde que a acompanha e as pessoas de confiança no mesmo cuidado.</p>
        </div>
        <div>
          <h2>O app</h2>
          <ul>
            <li><a href="${raiz}#recursos">Recursos</a></li>
            <li><a href="${raiz}#bia">Bia</a></li>
            <li><a href="${raiz}#para-quem">Para quem</a></li>
            <li><a href="${raiz}#perguntas">Perguntas</a></li>
          </ul>
        </div>
        <div>
          <h2>Ajuda</h2>
          <ul>
            <li><a href="${raiz}contato/">Suporte</a></li>
            <li><a href="${raiz}privacidade/">Política de privacidade</a></li>
            <li><a href="${raiz}termos/">Termos de uso</a></li>
            <li><a href="${raiz}excluir-conta/">Excluir conta</a></li>
          </ul>
        </div>
      </div>
      <p class="base">Juntas · ${EMAIL} · O Juntas não substitui atendimento de saúde. Em emergência, ligue 192 (SAMU).</p>
    </div>
  </footer>
</body>
</html>
`;
  mkdirSync(arquivo.includes('/') ? arquivo.slice(0, arquivo.lastIndexOf('/')) : '.', { recursive: true });
  writeFileSync(arquivo, html);
}

const RASCUNHO = `      <div class="rascunho" role="note">
        <strong>Rascunho em revisão</strong>
        Este texto ainda está sendo revisado pelo responsável pelo Juntas e pode mudar antes da publicação do app.
      </div>
`;

function documento({ titulo, lead, rascunho, conteudo }) {
  return `    <section class="doc-cabeca">
      <div class="container">
${rascunho ? RASCUNHO : ''}        <h1>${titulo}</h1>
        <p class="lead">${lead}</p>
      </div>
    </section>
    <div class="container doc">
${conteudo}
    </div>`;
}

const tela = (nome, alt, raiz = '', extra = '') =>
  `<img src="${raiz}assets/telas/${nome}.webp" alt="${alt}" width="700" height="1472"${extra}>`;

const icones = {
  semAnuncio:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/></svg>',
  escudo:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
  pessoas:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14c2 .7 3 2.8 3 6"/></svg>',
};

// Início
pagina({
  arquivo: 'index.html',
  caminho: '',
  raiz: '',
  titulo: 'Juntas: gravidez acompanhada',
  descricao:
    'O Juntas reúne a gestante, a profissional de saúde que a acompanha e as pessoas de confiança ao lado dela. Em breve na App Store e no Google Play.',
  corpo: `    <section class="hero">
      <div class="container hero-in">
        <div>
          <span class="selo">Gravidez acompanhada</span>
          <h1>Você não está <em>sozinha</em> nessa gravidez.</h1>
          <p class="lead">O Juntas reúne no mesmo lugar a gestante, a profissional de saúde que a acompanha e as pessoas de confiança que estão ao lado dela.</p>
          <ul class="lojas" aria-label="Lojas de aplicativos">
            <li><span class="loja"><small>Em breve na</small><strong>App Store</strong></span></li>
            <li><span class="loja"><small>Em breve no</small><strong>Google Play</strong></span></li>
          </ul>
          <p class="nota">Para iPhone e Android.</p>
        </div>
        <div class="arte">
          ${tela('inicio', 'Tela Início do Juntas: semanas de gestação, check-in de humor e o lembrete do medicamento', '', ' class="frente" fetchpriority="high"')}
          ${tela('bia', 'Conversa com a Bia no Juntas', '', ' class="tras"')}
        </div>
      </div>
    </section>

    <section class="garantias" aria-label="Compromissos">
      <ul class="container">
        <li>${icones.semAnuncio}Sem anúncios, fórum nem loja</li>
        <li>${icones.escudo}Você decide quem vê o quê</li>
        <li>${icones.pessoas}Cada pessoa com a sua conta</li>
      </ul>
    </section>

    <section class="secao" id="recursos">
      <div class="container">
        <div class="secao-cabeca">
          <span class="olho">Para a gestante</span>
          <h2>Tudo da sua gravidez, num lugar só</h2>
          <p>O cuidado que a sua profissional cadastra, o que você registra e as pessoas que estão com você.</p>
        </div>

        <div class="recurso">
          <div class="figura">${tela('inicio', 'Tela Início do Juntas', '', ' loading="lazy"')}</div>
          <div class="texto">
            <h2>Seu dia, num relance</h2>
            <p>Sua idade gestacional, o lembrete do medicamento, a próxima consulta e a última orientação da sua profissional.</p>
            <ul class="checks">
              <li>Consultas, exames, medicamentos e orientações cadastrados pela sua profissional</li>
              <li>Check-in de como você está se sentindo, em um toque</li>
              <li>Contrações com duração e intervalo anotados</li>
              <li>Linha do tempo de tudo o que aconteceu, com busca e filtros</li>
            </ul>
          </div>
        </div>

        <div class="recurso" id="bia">
          <div class="figura areia">${tela('bia', 'Conversa com a Bia', '', ' loading="lazy"')}</div>
          <div class="texto">
            <span class="olho">Minha companheira</span>
            <h2>Bia escuta a qualquer hora</h2>
            <p>Uma companheira de conversa só sua. Ela guarda o que você quiser que ela lembre, e você lê e apaga quando quiser.</p>
            <ul class="checks">
              <li>Só funciona se você ativar</li>
              <li>Dá para desligar quando quiser</li>
            </ul>
            <p class="aviso">A Bia não é profissional de saúde: não diagnostica, não prescreve e não avalia exames, sintomas nem fotos.</p>
          </div>
        </div>

        <div class="recurso">
          <div class="figura salvia">${tela('rede', 'Tela Rede, com as permissões de cada pessoa de confiança', '', ' loading="lazy"')}</div>
          <div class="texto">
            <span class="olho">Sua rede</span>
            <h2>Você decide quem vê o quê</h2>
            <p>Você compartilha um código e confirma cada pessoa que entra.</p>
            <ul class="checks">
              <li>Para cada pessoa de confiança, escolha se ela vê suas consultas, seus lembretes e seus check-ins</li>
              <li>Qualquer vínculo pode ser desfeito a qualquer momento</li>
            </ul>
          </div>
        </div>

        <div class="recurso">
          <div class="figura dupla">
            ${tela('atendimento', 'Tela Preciso de atendimento', '', ' loading="lazy"')}
            ${tela('preciso-de-voce', 'Tela Preciso de você', '', ' loading="lazy"')}
          </div>
          <div class="texto">
            <span class="olho">Quando precisar</span>
            <h2>Peça ajuda sem cerimônia</h2>
            <p>Envie um alerta para a sua profissional com sintomas, descrição e foto opcional, e acompanhe quando ela visualizar. Ou peça uma carona, um medicamento ou um desejo a uma pessoa de confiança.</p>
            <p class="aviso">Em emergência, ligue 192 (SAMU) ou procure um pronto atendimento.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="secao escura" id="para-quem">
      <div class="container">
        <div class="secao-cabeca">
          <span class="olho">Para quem</span>
          <h2>Três pessoas, um mesmo cuidado</h2>
          <p>Cada uma tem a sua conta e vê só o que precisa ver.</p>
        </div>
        <ul class="papeis">
          <li class="papel">
            <div class="corpo">
              <h3>Gestante</h3>
              <p>Organiza a gravidez, monta a sua rede e conversa com a Bia.</p>
              <span class="preco">Assinatura mensal ou anual</span>
            </div>
            <div class="tela">${tela('contracoes', 'Registro de contrações', '', ' loading="lazy"')}</div>
          </li>
          <li class="papel">
            <div class="corpo">
              <h3>Profissional</h3>
              <p>Vê os alertas das suas gestantes, abre a ficha de cada uma e cadastra o cuidado.</p>
              <span class="preco">Compra única</span>
            </div>
            <div class="tela">${tela('profissional', 'Tela Hoje da profissional, com os alertas', '', ' loading="lazy"')}</div>
          </li>
          <li class="papel">
            <div class="corpo">
              <h3>Pessoa de confiança</h3>
              <p>Recebe os pedidos dela, responde e acompanha o que ela decidir compartilhar.</p>
              <span class="preco">Gratuita</span>
            </div>
            <div class="tela">${tela('pessoa-de-confianca', 'Pedidos recebidos pela pessoa de confiança', '', ' loading="lazy"')}</div>
          </li>
        </ul>
      </div>
    </section>

    <section class="secao" id="perguntas">
      <div class="container">
        <div class="secao-cabeca">
          <span class="olho">Perguntas</span>
          <h2>Perguntas frequentes</h2>
        </div>
        <div class="perguntas">
          <details>
            <summary>O Juntas substitui a minha profissional de saúde?</summary>
            <p>Não. O Juntas é uma ferramenta de organização e comunicação. Não faz consulta, diagnóstico nem prescrição. Em emergência, ligue 192 (SAMU).</p>
          </details>
          <details>
            <summary>Quanto custa?</summary>
            <p>A gestante assina por mês ou por ano, com renovação automática. A profissional faz uma compra única. A pessoa de confiança não paga. Os preços aparecem na loja antes da compra.</p>
          </details>
          <details>
            <summary>Como cancelo a assinatura?</summary>
            <p>Na loja onde você comprou: no iPhone, em Ajustes, no seu nome, Assinaturas; no Android, no Google Play, em Pagamentos e assinaturas.</p>
          </details>
          <details>
            <summary>Quem vê os meus dados?</summary>
            <p>A profissional vinculada vê o seu cuidado. Cada pessoa de confiança vê só o que você liberar. Ninguém da sua rede vê a conversa com a Bia. Veja a <a href="privacidade/">política de privacidade</a>.</p>
          </details>
          <details>
            <summary>Preciso usar a Bia?</summary>
            <p>Não. A Bia só funciona se você ativar, e dá para desligar quando quiser. Desligar não apaga a sua conta.</p>
          </details>
          <details>
            <summary>Posso excluir a minha conta?</summary>
            <p>Sim, quando quiser. Veja <a href="excluir-conta/">como excluir a conta</a>.</p>
          </details>
        </div>
      </div>
    </section>

    <section class="chamada" id="baixar">
      <div class="container">
        <div class="chamada-in">
          <div class="texto">
            <h2>Em breve na App Store e no Google Play</h2>
            <p>Dúvidas? Escreva para ${mail()}.</p>
            <ul class="lojas" aria-label="Lojas de aplicativos">
              <li><span class="loja"><small>Em breve na</small><strong>App Store</strong></span></li>
              <li><span class="loja"><small>Em breve no</small><strong>Google Play</strong></span></li>
            </ul>
          </div>
          <div class="tela">${tela('bia', '', '', ' loading="lazy"')}</div>
        </div>
      </div>
    </section>`,
});

// Suporte
pagina({
  arquivo: 'contato/index.html',
  caminho: 'contato/',
  raiz: '../',
  titulo: 'Suporte · Juntas',
  descricao: 'Fale com o Juntas: dúvidas, problemas na conta, assinatura e privacidade.',
  atual: 'contato/',
  corpo: documento({
    titulo: 'Suporte',
    lead: 'Dúvidas, problemas na conta, assinatura ou privacidade: escreva para a gente.',
    conteudo: `      <div class="cartao">
        <h2>E-mail</h2>
        <p>${mail()}</p>
        <p class="nota">Escreva do e-mail da sua conta e diga o seu papel (gestante, profissional ou pessoa de confiança). Nunca mande a sua senha.</p>
      </div>

      <h2>Assinatura</h2>
      <p>A assinatura é cobrada pela loja onde você comprou. Para cancelar ou mudar de plano:</p>
      <ul>
        <li><strong>iPhone:</strong> Ajustes, toque no seu nome, Assinaturas.</li>
        <li><strong>Android:</strong> Google Play, Pagamentos e assinaturas, Assinaturas.</li>
      </ul>
      <p>Reembolsos também são pedidos à loja: a Apple em <a href="https://reportaproblem.apple.com/">reportaproblem.apple.com</a>, o Google Play pela página de ajuda dele.</p>

      <h2>Privacidade e seus dados</h2>
      <p>Para exercer os seus direitos da LGPD, use o mesmo e-mail. Veja a <a href="../privacidade/">política de privacidade</a> e como <a href="../excluir-conta/">excluir a sua conta</a>.</p>

      <div class="cartao tint">
        <h2>Em emergência</h2>
        <p>O suporte não presta atendimento de saúde. Em emergência, ligue <strong>192 (SAMU)</strong> ou procure um pronto atendimento.</p>
      </div>`,
  }),
});

// Política de privacidade
pagina({
  arquivo: 'privacidade/index.html',
  caminho: 'privacidade/',
  raiz: '../',
  titulo: 'Política de privacidade · Juntas',
  descricao: 'Como o Juntas trata os seus dados pessoais, de acordo com a LGPD.',
  corpo: documento({
    titulo: 'Política de privacidade',
    lead: 'Versão de 27 de outubro de 2026.',
    rascunho: true,
    conteudo: `      <p>Esta política explica como o Juntas trata os seus dados pessoais, de acordo com a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018). Não vendemos os seus dados e não os usamos para publicidade.</p>

      <h2 id="controlador">1. Quem é o controlador</h2>
      <p>[nome completo ou razão social e CPF/CNPJ do responsável]. Contato e canal do titular: ${mail()}.</p>
      <p>Encarregado: [definir o nome e o contato, ou a decisão de não indicar].</p>

      <h2 id="dados">2. Quais dados tratamos e para quê</h2>
      <ul>
        <li><strong>Conta (todos os papéis):</strong> nome, e-mail, papel e senha (guardada cifrada). Se você entrar com Google ou Apple, o identificador que eles nos enviam. Para criar a conta e deixar você entrar.</li>
        <li><strong>Gestação (gestante):</strong> nascimento, data da última menstruação, check-ins, alertas, pedidos, contrações, consultas, exames e documentos de exame, medicamentos, orientações, notas, medidas do bebê, parto e as permissões da rede. <strong>São dados de saúde, dados pessoais sensíveis.</strong> Para organizar o cuidado e mostrar à profissional e às pessoas de confiança o que a gestante autorizar.</li>
        <li><strong>Bia (gestante, só com o opt-in):</strong> a conversa, os arquivos enviados e os fatos que a Bia guarda. Também são dados de saúde. Para conversar com a Bia. Dá para desligar quando quiser, de graça. Desligar não apaga a conta.</li>
        <li><strong>Assinatura:</strong> plano, loja e validade. Não recebemos dados de cartão: quem cobra é a App Store ou o Google Play.</li>
        <li><strong>Aparelho e uso técnico:</strong> identificador de notificação do aparelho, sessão, registros de acesso (como o endereço IP) e relatórios de erro com o número interno da conta. Para enviar notificações, manter você conectada e corrigir erros.</li>
      </ul>

      <h2 id="rede">3. Quem vê os seus dados no app</h2>
      <p>A profissional vinculada vê o cuidado da gestante. Cada pessoa de confiança vê só o que a gestante liberar para ela. Ninguém da rede vê a conversa com a Bia. O vínculo só existe depois que a gestante confirma, e qualquer lado pode desfazê-lo.</p>

      <h2 id="operadores">4. Empresas que tratam dados em nome do Juntas</h2>
      <p>Contratamos empresas que só seguem as nossas instruções:</p>
      <div class="tabela">
        <table>
          <thead>
            <tr><th scope="col">Tarefa</th><th scope="col">País</th></tr>
          </thead>
          <tbody>
            <tr><td>Hospedagem do servidor e do banco de dados</td><td>Brasil</td></tr>
            <tr><td>Cópias de segurança</td><td>[confirmar o país]</td></tr>
            <tr><td>Respostas da Bia</td><td>[definir o provedor e o país]</td></tr>
            <tr><td>Controle das compras, e-mails da conta e entrega de notificações</td><td>Estados Unidos</td></tr>
            <tr><td>Relatórios de erro</td><td>União Europeia</td></tr>
          </tbody>
        </table>
      </div>
      <p>Para saber quais empresas fazem cada tarefa, ou pedir as cláusulas contratuais usadas nas transferências para o exterior, escreva para ${mail()}.</p>
      <p>Nas transferências para o exterior (LGPD, art. 33), enviamos só o necessário para cada tarefa.</p>

      <h2 id="retencao">5. Por quanto tempo guardamos</h2>
      <ul>
        <li>Conta e dados da gestação: enquanto a conta existir.</li>
        <li>Conversa com a Bia: 90 dias. Os fatos ficam até você apagá-los ou a conta acabar.</li>
        <li>Conta não confirmada: sete dias.</li>
        <li>Cópias de segurança: até 14 dias depois de um dado ser apagado.</li>
        <li>Registros de acesso: pelo prazo que a lei exigir.</li>
      </ul>

      <h2 id="direitos">6. Seus direitos e como excluir a conta</h2>
      <p>Pela LGPD (art. 18), você pode pedir: confirmação de que tratamos os seus dados; acesso; correção; anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade; portabilidade; eliminação dos dados tratados com o seu consentimento; informação sobre com quem compartilhamos; informação sobre poder não consentir e as consequências; e revogação do consentimento. Escreva para ${mail()} do e-mail da sua conta. Você também pode reclamar à <a href="https://www.gov.br/anpd">ANPD</a>.</p>
      <p>Para excluir a conta, veja <a href="../excluir-conta/">Excluir conta</a>.</p>

      <h2 id="mudancas">7. Mudanças</h2>
      <p>Quando esta política mudar, a data no topo muda. Se a mudança afetar algo que você consentiu, avisamos no app antes.</p>`,
  }),
});

// Termos de uso
pagina({
  arquivo: 'termos/index.html',
  caminho: 'termos/',
  raiz: '../',
  titulo: 'Termos de uso · Juntas',
  descricao: 'As regras de uso do aplicativo Juntas, incluindo assinatura e contas por papel.',
  corpo: documento({
    titulo: 'Termos de uso',
    lead: 'Versão de 27 de outubro de 2026.',
    rascunho: true,
    conteudo: `      <p>Estes termos valem para o aplicativo Juntas, oferecido por [nome completo ou razão social e CPF/CNPJ do responsável]. Ao criar uma conta, você concorda com eles e com a <a href="../privacidade/">política de privacidade</a>.</p>

      <div class="cartao tint">
        <h2>O Juntas não substitui atendimento de saúde</h2>
        <p>O Juntas é uma ferramenta de organização e comunicação. Não faz consulta, diagnóstico nem prescrição, e as informações educativas são gerais. Converse sempre com a sua profissional antes de decidir algo sobre a sua saúde. A Bia não é profissional de saúde. <strong>Em emergência, ligue 192 (SAMU) ou procure um pronto atendimento.</strong></p>
      </div>

      <h2 id="contas">1. Contas</h2>
      <p>Cada conta tem um papel, escolhido no cadastro e que não muda:</p>
      <ul>
        <li><strong>Gestante:</strong> organiza a gestação e decide quem entra na rede dela e o que cada pessoa vê.</li>
        <li><strong>Profissional:</strong> profissional de saúde que acompanha a gestante e cadastra o cuidado dela. Responde pelo que cadastra. O Juntas não confere registro profissional.</li>
        <li><strong>Pessoa de confiança:</strong> alguém que a gestante autoriza a acompanhar e a quem ela pede ajuda.</li>
      </ul>
      <p>Informe dados verdadeiros e guarde a sua senha. Podemos suspender uma conta que descumpra estes termos.</p>

      <h2 id="assinatura">2. Assinatura</h2>
      <ul>
        <li><strong>Gestante:</strong> assinatura mensal ou anual, com renovação automática.</li>
        <li><strong>Profissional:</strong> compra única, que vale enquanto a conta existir.</li>
        <li><strong>Pessoa de confiança:</strong> não paga.</li>
      </ul>
      <p>A compra é cobrada pela App Store ou pelo Google Play. A assinatura renova sozinha, pelo mesmo preço, a menos que você cancele pelo menos 24 horas antes do fim do período. Cancele na loja: no iPhone, em Ajustes, no seu nome, Assinaturas; no Android, no Google Play, em Pagamentos e assinaturas. Apagar o app não cancela. Reembolsos seguem as regras da loja e são pedidos a ela.</p>
      <p>Para compras na App Store, valem também os <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Termos de uso padrão da Apple para apps (EULA)</a>.</p>

      <h2 id="exclusao">3. Excluir a conta</h2>
      <p>Você pode excluir a conta quando quiser, como descrito em <a href="../excluir-conta/">Excluir conta</a>. Enquanto a assinatura da gestante estiver ativa na loja, cancele-a primeiro.</p>

      <h2 id="contato">4. Contato</h2>
      <p>${mail()}</p>`,
  }),
});

// Excluir conta (exigida pelo Google Play)
pagina({
  arquivo: 'excluir-conta/index.html',
  caminho: 'excluir-conta/',
  raiz: '../',
  titulo: 'Excluir conta · Juntas',
  descricao: 'Como excluir a sua conta do Juntas e o que acontece com os seus dados.',
  corpo: documento({
    titulo: 'Excluir conta',
    lead: 'Como excluir a sua conta do app Juntas: gravidez acompanhada, e o que acontece com os seus dados.',
    conteudo: `      <div class="cartao">
        <h2>No app</h2>
        <ol>
          <li>Abra o Juntas e vá em Perfil.</li>
          <li>Toque em Entrada e conta.</li>
          <li>Toque em Excluir conta, no fim da tela.</li>
          <li>Confirme entrando de novo com a sua senha ou com a sua conta Google ou Apple.</li>
        </ol>
      </div>

      <div class="cartao">
        <h2>Por e-mail</h2>
        <p>Se não conseguir pelo app, escreva para ${mail('Excluir minha conta')} a partir do e-mail da sua conta, com o assunto "Excluir minha conta". Podemos pedir uma confirmação de que a conta é sua.</p>
      </div>

      <h2>Antes de excluir</h2>
      <p>Se você é gestante e a sua assinatura está ativa, cancele-a primeiro na App Store ou no Google Play. O Juntas não consegue cancelar a cobrança na loja, então a exclusão só fica disponível quando o período pago termina. A compra única da profissional se perde com a exclusão.</p>

      <h2>O que é apagado</h2>
      <ul>
        <li>A exclusão é imediata e não pode ser desfeita.</li>
        <li>A conta (nome, e-mail, senha, métodos de entrada), os aparelhos e as preferências de notificação.</li>
        <li>Na conta da gestante: toda a jornada, incluindo check-ins, alertas, pedidos, contrações, documentos de exame, notas, a conversa com a Bia, os fatos e o que a profissional cadastrou para ela.</li>
        <li>Todos os vínculos terminam.</li>
      </ul>

      <h2>O que fica</h2>
      <ul>
        <li>Quando a profissional ou uma pessoa de confiança exclui a conta, o que já fazia parte da jornada da gestante (por exemplo, consultas cadastradas ou pedidos recebidos) fica com a gestante, sem o nome de quem saiu.</li>
        <li>Cópias de segurança do banco são substituídas em até 14 dias.</li>
        <li>Registros de acesso são guardados pelo prazo exigido por lei.</li>
        <li>A loja guarda o histórico da sua compra pelas regras dela.</li>
      </ul>
      <p>Mais detalhes na <a href="../privacidade/">política de privacidade</a>.</p>`,
  }),
});

// 404: servido em qualquer caminho, então usa <base> para achar os arquivos.
pagina({
  arquivo: '404.html',
  raiz: '',
  base: '\n  <base href="/juntas-site/">',
  titulo: 'Página não encontrada · Juntas',
  descricao: 'Página não encontrada.',
  corpo: documento({
    titulo: 'Página não encontrada',
    lead: 'O endereço pode ter mudado ou estar com um erro de digitação.',
    conteudo: `      <p><a href="./">Ir para o início</a> · <a href="contato/">Suporte</a> · <a href="privacidade/">Política de privacidade</a> · <a href="termos/">Termos de uso</a></p>`,
  }),
});

writeFileSync(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGINAS.map((c) => `  <url><loc>${SITE}${c}</loc></url>`).join('\n')}
</urlset>
`,
);
writeFileSync('robots.txt', `User-agent: *
Allow: /

Sitemap: ${SITE}sitemap.xml
`);

console.log('ok');
