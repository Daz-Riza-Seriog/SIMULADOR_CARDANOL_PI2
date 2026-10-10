/*
 * DATOS DE DEMOSTRACIÓN — Proyecto Integrador 2, Semana 1.
 * Se reconstruyó la lógica temática del artefacto de la clase. Los actores,
 * valores y vínculos de esta base NO son una exportación del original.
 * Para reutilizar la aplicación en otro proyecto, edita este archivo.
 */
window.SIM_DATA = Object.freeze({
  meta: {
    title: 'Simulador del cardanol',
    course: 'PI-2 · Semana 1 · Taller de 15 minutos',
    subtitle: 'Mapa de interesados, Canvas y solidez de supuestos del proyecto',
    context: 'Caso ilustrativo de investigación: obtención de derivados del cardanol a partir de cáscara de marañón para formulación de oleogeles.',
    detail: 'El caso del curso considera la pirólisis de cáscara de marañón a 550 °C, un rendimiento reportado de 69,15 % de líquido rico en cardanol, el paso de TRL 2 a 4, 24 meses y 650 millones COP. El rendimiento se atribuye en el artefacto a Cruz-Reina et al. (2023); plazos y valores son ilustrativos. El uso inicial propuesto es cosmética y lubricantes; el alimentario requiere evidencia de inocuidad.',
    metrics: [
      {label: 'Madurez tecnológica', value: 'TRL 2 → 4'},
      {label: 'Plazo', value: '24 meses'},
      {label: 'Recursos ilustrativos', value: '$650 M COP'},
      {label: 'Enfoque', value: 'Investigación'}
    ]
  },
  actors: [
    {id:'uni', name:'Grupo de investigación', short:'Investigadores', sector:'Academia', description:'Desarrolla las formulaciones y evidencia de laboratorio.', p:5, i:5, a:2, e:1},
    {id:'empresa', name:'Empresa aliada', short:'Empresa aliada', sector:'Industria', description:'Apoya la validación de potenciales aplicaciones y requisitos de adopción.', p:5, i:5, a:2, e:1},
    {id:'fondo', name:'Entidad financiadora', short:'Financiador', sector:'Financiación', description:'Decide sobre aprobación, desembolsos e hitos del proyecto.', p:5, i:4, a:1, e:1},
    {id:'vichada', name:'Productores y recolectores', short:'Recolectores', sector:'Territorio', description:'Posibles participantes del abastecimiento de la materia prima.', p:3, i:4, a:1, e:1},
    {id:'lab', name:'Laboratorio de validación', short:'Laboratorio', sector:'Técnico', description:'Apoya la caracterización, reproducibilidad y pruebas.', p:4, i:4, a:1, e:1},
    {id:'reg', name:'Autoridad regulatoria', short:'Regulador', sector:'Regulación', description:'Interviene en permisos, requisitos y seguridad de uso.', p:5, i:3, a:-1, e:1},
    {id:'usuarios', name:'Usuarios de cosmética / lubricantes', short:'Usuarios', sector:'Mercado', description:'Validan necesidades y criterios de aceptación de aplicaciones no alimentarias.', p:3, i:4, a:0, e:1},
    {id:'otri', name:'Oficina de transferencia', short:'Transferencia', sector:'Gestión', description:'Acompaña propiedad intelectual y mecanismos de transferencia.', p:3, i:3, a:1, e:1},
    {id:'comunidad', name:'Comunidad del territorio', short:'Comunidad', sector:'Social', description:'Puede respaldar o cuestionar impactos ambientales y sociales del aprovechamiento.', p:3, i:4, a:0, e:1}
  ],
  assumptions: [
    {id:'C1', title:'Cardanol: disponibilidad y rendimiento', block:'Recursos clave', detail:'La ruta de obtención y el suministro permiten disponer de fracciones útiles para ensayos.', note:'Distinguir el rendimiento publicado de la reproducibilidad en este proyecto.'},
    {id:'C2', title:'Oleogel funcional con ≤ 5 % p/p', block:'Propuesta de valor', detail:'Los derivados permiten estructurar aceites vegetales dentro del objetivo formulativo del caso.', note:'Debe validarse con ensayos y criterios de desempeño verificables.'},
    {id:'C3', title:'Alcanzar TRL 4 en 24 meses', block:'Actividades clave', detail:'Los hitos, instalaciones y equipos pueden articularse para una demostración de laboratorio.', note:'El involucramiento no sustituye experimentación ni capacidad técnica.'},
    {id:'C4', title:'Adopción en cosmética y lubricantes', block:'Segmentos de usuarios', detail:'Una empresa y potenciales usuarios validan usos no alimentarios y requisitos de aplicación.', note:'Requiere evidencia de mercado y validación con aliados.'},
    {id:'C4b', title:'Uso alimentario: evidencia de inocuidad', block:'Segmentos de usuarios', detail:'La variante plantea una aplicación alimentaria, todavía condicionada por evidencia específica de seguridad.', note:'Como ejercicio didáctico, este supuesto conserva una barrera técnica propia que ningún plan de actores elimina.'},
    {id:'C5', title:'Financiación por hitos', block:'Fuentes de financiación', detail:'La entidad aportante mantiene desembolsos sujetos al cumplimiento de entregables.', note:'Vincular hitos verificables, presupuesto y requisitos documentales.'},
    {id:'C6', title:'Abastecimiento responsable en Vichada', block:'Socios clave', detail:'La cadena de suministro es socialmente aceptable y técnicamente estable.', note:'Validar trazabilidad, disponibilidad y condiciones ambientales.'}
  ],
  // La matriz indica influencia potencial, NO causalidad comprobada.
  links: {
    C1:['uni','vichada','lab','comunidad'],
    C2:['uni','empresa','lab','usuarios'],
    C3:['uni','fondo','lab','otri'],
    C4:['empresa','usuarios','otri','reg'],
    C4b:['uni','empresa','usuarios','reg','lab'],
    C5:['fondo','uni','otri'],
    C6:['vichada','comunidad','empresa','reg']
  },
  canvas: [
    {title:'Socios clave', key:'partners', text:'Grupo de investigación, empresa aliada, recolectores y actores de transferencia.', links:['C6']},
    {title:'Actividades clave', key:'activities', text:'Pirólisis, separación, síntesis, formulación, caracterización y validación de oleogeles.', links:['C3']},
    {title:'Recursos clave', key:'resources', text:'Cáscara de marañón, infraestructura experimental, talento y capacidad analítica.', links:['C1']},
    {title:'Propuesta de valor', key:'value', text:'Valorizar un subproducto y estudiar alternativas funcionales para estructurar aceites.', links:['C2']},
    {title:'Relación con aliados', key:'relationships', text:'Acuerdos de colaboración, seguimiento de hitos y validación técnica conjunta.', links:['C3','C5']},
    {title:'Canales', key:'channels', text:'Pruebas con empresa aliada, transferencia tecnológica y divulgación académica.', links:['C4']},
    {title:'Segmentos / usuarios', key:'segments', text:'Aplicaciones exploratorias en cosmética y lubricantes; uso alimentario no habilitado.', links:['C4','C4b']},
    {title:'Estructura de costos', key:'costs', text:'Equipos, análisis, personal, materia prima, gestión y pruebas.', links:['C3','C5']},
    {title:'Fuentes de financiación', key:'funding', text:'Convocatoria pública ilustrativa por $650 millones COP, desembolsada por hitos.', links:['C5']}
  ]
});
