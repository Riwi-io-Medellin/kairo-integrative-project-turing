

//  DATA — 3 secciones × 10 preguntas
const SECTIONS = [
{
    id: 0,
    tag: 'Sección 1',
    tagClass: 'tag-1',
    title: 'Estilos de Aprendizaje ILS',
    desc: 'Responde cada pregunta eligiendo la opción que mejor te describa. Si ambas aplican, elige la que uses con más frecuencia.',
    icon: '🧠',
    instrument: 'ILS',
    questions: [
      // Cada pregunta mapea a una de las 4 escalas ILS
      // scale: 'ACT_REF' | 'SNS_INT' | 'VIS_VRB' | 'SEQ_GLO'
      // a → primera dimensión (ACT, SNS, VIS, SEQ)
      // b → segunda dimensión (REF, INT, VRB, GLO)
    { id: 1,  scale: 'ACT_REF', text: 'Entiendo algo mejor después de...', opts: ['Intentarlo', 'Pensarlo bien'] },
    { id: 2,  scale: 'SNS_INT', text: 'Prefiero que me consideren...', opts: ['Realista', 'Innovador/a'] },
    { id: 3,  scale: 'VIS_VRB', text: 'Cuando pienso en lo que hice ayer, tiendo a obtener...', opts: ['Una imagen', 'Palabras'] },
    { id: 4,  scale: 'SEQ_GLO', text: 'Tiendo a...', opts: ['Entender los detalles pero perderme la estructura general', 'Entender la estructura general pero ser vago/a con los detalles'] },
    { id: 5,  scale: 'ACT_REF', text: 'Cuando aprendo algo nuevo, me ayuda...', opts: ['Hablar de ello', 'Pensar en ello'] },
    { id: 6,  scale: 'SNS_INT', text: 'Si fuera docente, preferiría enseñar un curso...', opts: ['Sobre hechos y situaciones reales', 'Sobre ideas y teorías'] },
    { id: 7,  scale: 'VIS_VRB', text: 'Prefiero recibir información nueva en...', opts: ['Imágenes, diagramas, gráficos o mapas', 'Instrucciones escritas o información verbal'] },
    { id: 8,  scale: 'SEQ_GLO', text: 'Una vez que entiendo...', opts: ['Todas las partes, entiendo el todo', 'El todo, veo cómo encajan las partes'] },
    { id: 9,  scale: 'ACT_REF', text: 'En un grupo de estudio sobre material difícil, es más probable que...', opts: ['Me lance a aportar ideas', 'Me quede callado/a escuchando'] },
    { id: 10, scale: 'SNS_INT', text: 'Me resulta más fácil...', opts: ['Aprender hechos', 'Aprender conceptos'] },

]
},
{
    id: 1,
    tag: 'Sección 2',
    tagClass: 'tag-2',
    title: 'Preferencias VARK',
    desc: 'Elige la opción que mejor explique tu preferencia. Puedes elegir más de una si ninguna sola te describe bien.',
    icon: '📡',
    instrument: 'VARK',
    questions: [
      // scoring: array con categoría por cada opción [a, b, c, d] → V, A, R, K
    {
    id: 1, text: 'Estás ayudando a alguien que quiere ir al aeropuerto, al centro o la estación de tren. Tú...',
    opts: ['Voy con ella', 'Le digo las indicaciones', 'Le escribo las indicaciones', 'Le dibujo o muestro un mapa'],
    scoring: ['K', 'A', 'R', 'V']
    },
    {
    id: 2, text: 'Un sitio web tiene un video que muestra cómo hacer una gráfica especial, con texto y diagramas. Aprenderías más de...',
    opts: ['Los diagramas', 'Escuchando', 'Leyendo las palabras', 'Viendo las acciones'],
    scoring: ['V', 'A', 'R', 'K']
    },
    {
    id: 3, text: 'Estás planeando vacaciones para un grupo y quieres su opinión. Tú...',
    opts: ['Describes los momentos destacados que vivirán', 'Usas un mapa para mostrar los lugares', 'Les das una copia del itinerario impreso', 'Los llamas, escribes o envías correo'],
    scoring: ['K', 'V', 'R', 'A']
    },
    {
    id: 4, text: 'Vas a cocinar algo especial. Tú...',
    opts: ['Cocinas algo que sabes sin instrucciones', 'Le preguntas a amigos por sugerencias', 'Buscas en Internet ideas por las fotos', 'Usas una buena receta'],
    scoring: ['K', 'A', 'V', 'R']
    },
    {
    id: 5, text: 'Un grupo de turistas quiere aprender sobre los parques de tu área. Tú...',
    opts: ['Hablas de los parques o arreglas una charla sobre ellos', 'Les muestras mapas e imágenes de internet', 'Los llevas a un parque a caminar con ellos', 'Les das un libro o folletos sobre los parques'],
    scoring: ['A', 'V', 'K', 'R']
    },
    {
    id: 6, text: 'Estás a punto de comprar una cámara digital o teléfono. Además del precio, ¿qué influiría más en tu decisión?',
    opts: ['Probarla o testarla', 'Leer los detalles o revisar sus características online', 'Que sea un diseño moderno y se vea bien', 'Que el vendedor me cuente sus características'],
    scoring: ['K', 'R', 'V', 'A']
    },
    {
    id: 7, text: 'Recuerda cuando aprendiste algo nuevo (no una habilidad física). Aprendiste mejor...',
    opts: ['Viendo una demostración', 'Escuchando a alguien explicar y haciendo preguntas', 'Con diagramas, mapas y gráficos - pistas visuales', 'Con instrucciones escritas – un manual o libro'],
    scoring: ['K', 'A', 'V', 'R']
    },
    {
    id: 8, text: 'Tienes un problema cardíaco. Preferirías que el médico...',
    opts: ['Te diera algo para leer que explique qué salió mal', 'Usara un modelo de plástico para mostrar qué salió mal', 'Describiera qué salió mal', 'Te mostrara un diagrama de lo que salió mal'],
    scoring: ['R', 'K', 'A', 'V']
    },
    {
    id: 9, text: 'Quieres aprender un nuevo programa, habilidad o juego en la computadora. Tú...',
    opts: ['Lees las instrucciones escritas que vinieron con el programa', 'Hablas con personas que saben del programa', 'Usas los controles o teclado', 'Sigues los diagramas del libro que vino con el programa'],
    scoring: ['R', 'A', 'K', 'V']
    },
    {
    id: 10, text: 'Me gustan los sitios web que tienen...',
    opts: ['Cosas en las que puedo hacer clic, mover o intentar', 'Diseño interesante y características visuales', 'Descripciones escritas interesantes, listas y explicaciones', 'Canales de audio con música, programas de radio o entrevistas'],
    scoring: ['K', 'V', 'R', 'A']
    },

]
},
 // ─────────────────────────────────────────────
  // SECCIÓN 3 — Kolb LSI
  // Estilos: CE (Concrete Experience), RO (Reflective Observation),
  //          AC (Abstract Conceptualization), AE (Active Experimentation)
  // Tipo: rank — el usuario ordena de 4 (más característico) a 1 (menos)
  // ─────────────────────────────────────────────
  {
    id: 2,
    tag: 'Sección 3',
    tagClass: 'tag-3',
    title: 'Inventario Kolb',
    desc: 'Para cada enunciado, ordena las 4 opciones de 4 (más característico de ti) a 1 (menos característico). Cada número debe usarse una sola vez.',
    icon: '🔄',
    instrument: 'KOLB',
    questions: [
      // scoring: array de dimensiones por opción [a, b, c, d]
      // CE=vivir la experiencia, RO=reflexionar, AC=pensar/conceptualizar, AE=experimentar/actuar
    {
    id: 1, text: 'Cuando aprendo...',
    opts: ['Me involucro totalmente en nuevas experiencias', 'Observo y reflexiono con cuidado', 'Prefiero analizar ideas y conceptos', 'Me gusta probar cosas y ver si funcionan'],
    scoring: ['CE', 'RO', 'AC', 'AE']
    },
    {
    id: 2, text: 'Aprendo mejor cuando...',
    opts: ['Confío en mis sentimientos e intuición', 'Escucho y observo atentamente', 'Pienso racionalmente sobre las cosas', 'Puedo intentarlo yo mismo/a'],
    scoring: ['CE', 'RO', 'AC', 'AE']
    },
    {
    id: 3, text: 'Cuando aprendo, tiendo a...',
    opts: ['Tener sentimientos e intuiciones fuertes', 'Ser reservado/a y tranquilo/a', 'Usar lógica y razonamiento', 'Ser responsable de las cosas'],
    scoring: ['CE', 'RO', 'AC', 'AE']
    },
    {
    id: 4, text: 'Aprendo con...',
    opts: ['Sentimientos', 'Observación', 'Pensamiento', 'Acción'],
    scoring: ['CE', 'RO', 'AC', 'AE']
    },
    {
    id: 5, text: 'Cuando aprendo, soy...',
    opts: ['Abierto/a a nuevas experiencias', 'Cuidadoso/a al hacer juicios', 'Analítico/a', 'Orientado/a a la práctica'],
    scoring: ['CE', 'RO', 'AC', 'AE']
    },
    {
    id: 6, text: 'Cuando aprendo...',
    opts: ['Soy intuitivo/a', 'Observo antes de actuar', 'Me gusta analizar situaciones', 'Me siento bien haciendo cosas'],
    scoring: ['CE', 'RO', 'AC', 'AE']
    },
    {
    id: 7, text: 'Aprendo mejor desde...',
    opts: ['Relaciones personales', 'Observación', 'Teorías racionales', 'Una oportunidad de practicar'],
    scoring: ['CE', 'RO', 'AC', 'AE']
    },
    {
    id: 8, text: 'Cuando aprendo...',
    opts: ['Me siento involucrado/a personalmente en las cosas', 'Me tomo el tiempo necesario para entender', 'Me gustan las ideas y teorías', 'Pruebo las ideas en la práctica'],
    scoring: ['CE', 'RO', 'AC', 'AE']
    },
    {
    id: 9, text: 'Aprendo mejor cuando...',
    opts: ['Confío en mis sentimientos', 'Dependo de mis observaciones', 'Dependo de mis ideas', 'Puedo probar cosas por mí mismo/a'],
    scoring: ['CE', 'RO', 'AC', 'AE']
    },
    {
    id: 10, text: 'Cuando aprendo...',
    opts: ['Soy una persona receptiva', 'Soy una persona reservada', 'Soy una persona racional', 'Soy una persona responsable'],
    scoring: ['CE', 'RO', 'AC', 'AE']
    },
    
]
}
];


//  STATE

let state = {
sectionIdx: 0,
questionIdx: 0,
answers: Array.from({length:3}, () => Array(10).fill(null)),
startTime: Date.now()
};


//  HELPERS

const $ = id => document.getElementById(id);

function totalAnswered() {
return state.answers.flat().filter(a => a !== null).length;
}
function sectionAnswered(s) {
return state.answers[s].filter(a => a !== null).length;
}


//  RENDER

function render() {
    const sec = SECTIONS[state.sectionIdx];
    const q   = sec.questions[state.questionIdx];
    const ans = state.answers[state.sectionIdx][state.questionIdx];
const totalQ = 30;

  // Nav
$('navStep').textContent = `Sección ${state.sectionIdx+1} de 3`;
  const pct = Math.round((totalAnswered() / totalQ) * 100);
$('navPct').textContent = `${pct}% Completado`;

  // Pills
for(let i=0;i<3;i++){
    const p = $(`pill-${i}`);
    p.className = `pill pill-${i+1}`;
    if(i < state.sectionIdx) p.classList.add('done');
    else if(i === state.sectionIdx) p.classList.add('active');
}

  // Progress bars
for(let i=0;i<3;i++){
    const fill = $(`fill-${i}`);
    const seg  = $(`prog-${i}`);
    if(i < state.sectionIdx){
    seg.classList.add('done');
    } else if(i === state.sectionIdx){
    seg.classList.remove('done');
    fill.style.width = `${(sectionAnswered(i)/10)*100}%`;
    } else {
    seg.classList.remove('done');
    fill.style.width = '0%';
    }
}

  // Section header
$('sectionHeader').innerHTML = `
    <div class="section-tag ${sec.tagClass}">${sec.icon} ${sec.tag}</div>
    <h1 class="section-title">${sec.title}</h1>
    <p class="section-desc">${sec.desc}</p>
`;

  // Q num
const absQ = state.sectionIdx*10 + state.questionIdx + 1;
$('qNum').innerHTML = `Pregunta <span>${absQ}</span> de 30`;
$('qCurrent').textContent = state.questionIdx + 1;
$('qTotal').textContent = 10;

  // Q text
$('qText').textContent = q.text;

  // Options
const optsDiv = $('qOptions');
if(q.type === 'scale'){
optsDiv.innerHTML = `
    <div class="scale-options">
    ${[1,2,3,4,5].map(n=>`
        <button class="scale-opt${ans===n?' selected':''}" onclick="selectAnswer(${n})">${n}</button>
    `).join('')}
    </div>
    <div class="scale-labels">
    <span>Nunca / Muy poco</span>
    <span>Siempre / Mucho</span>
    </div>
`;
} else {
    const letters = ['A','B','C','D'];
    optsDiv.innerHTML = `<div class="options">
    ${q.opts.map((o,i)=>`
    <button class="option${ans===i?' selected':''}" onclick="selectAnswer(${i})">
        <span class="option-letter">${letters[i]}</span>
        ${o}
    </button>
    `).join('')}
</div>`;
}

  // Buttons
$('btnBack').disabled = (state.sectionIdx === 0 && state.questionIdx === 0);
$('btnNext').disabled = (ans === null);

  // Change label on last question of last section
if(state.sectionIdx === 2 && state.questionIdx === 9){
    $('btnNext').textContent = 'Finalizar ✓';
} else if(state.questionIdx === 9){
    $('btnNext').textContent = 'Siguiente sección →';
} else {
    $('btnNext').textContent = 'Siguiente →';
}

  // Card accent color
const card = $('qCard');
card.style.setProperty('--card-accent', sec.color);
card.style.cssText += `--card-accent:${sec.color}`;
}

function selectAnswer(val){
state.answers[state.sectionIdx][state.questionIdx] = val;
render();
$('qCard').classList.remove('q-enter');
void $('qCard').offsetWidth;
$('qCard').classList.add('q-enter');
}

function goNext(){
if(state.answers[state.sectionIdx][state.questionIdx] === null) return;

if(state.questionIdx < 9){
    state.questionIdx++;
    animCard();
    render();
} else if(state.sectionIdx < 2){
    // Section transition
    showTransition(state.sectionIdx + 1, () => {
    state.sectionIdx++;
    state.questionIdx = 0;
    render();
    });
} else {
    // Done
    showCompletion();
}
}

function goBack(){
if(state.questionIdx > 0){
    state.questionIdx--;
    animCard('back');
    render();
} else if(state.sectionIdx > 0){
    state.sectionIdx--;
    state.questionIdx = 9;
    animCard('back');
    render();
}
}

function animCard(dir='fwd'){
    const c = $('qCard');
    c.classList.remove('q-enter','q-exit');
    void c.offsetWidth;
    c.classList.add('q-enter');
}


//  SECTION TRANSITION
function showTransition(nextIdx, cb){
    const next = SECTIONS[nextIdx];
    const overlay = $('sectionTransition');

    $('transIcon').innerHTML = `<div style="width:72px;height:72px;border-radius:20px;background:${next.transColor};display:flex;align-items:center;justify-content:center;font-size:36px">${next.icon}</div>`;
    $('transTitle').textContent = next.title;
    $('transDesc').textContent = next.desc;
    $('transFill').style.background = next.color;

    overlay.classList.add('show');

setTimeout(() => {
    overlay.classList.remove('show');
    cb();
}, 2200);
}


//  COMPLETION

function showCompletion(){
    const mins = Math.round((Date.now() - state.startTime) / 60000);
    $('compTime').textContent = mins < 1 ? '<1' : mins;
    $('completion').classList.add('show');
}


//  INIT

render();
$('qCard').classList.add('q-enter');
