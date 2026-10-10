# Simulador del cardanol — Proyecto Integrador 2 (Semana 1)

Aplicación **estática e interactiva** para ilustrar la relación entre el mapa de interesados, las estrategias de vinculación, los supuestos críticos y el Canvas de un proyecto de investigación.

**Uso:** demostración académica y plantilla reutilizable. Se puede abrir sin servidor ni compilador: basta con abrir `index.html`. También funciona en **GitHub Pages**. No almacena información en servidores y no necesita conexión después de cargar los archivos.

> **IMPORTANTE — Alcance de la reconstrucción:** La estructura de secciones y los objetivos del ejercicio se recuperaron del artefacto web de la clase y del material de la Semana 1. No se obtuvo el código fuente original, sus valores de actores o las ecuaciones completas. Por tanto, este repositorio **no es una copia exacta**: es una implementación independiente con datos y reglas **ilustrativas**, documentadas y editables. No presenta las puntuaciones como resultados del docente ni de una evaluación validada. La versión alimentaria es una herramienta para cuestionar supuestos, no un dictamen de inocuidad.

## Estructura (igual a un repositorio web básico)

```text
simulador-cardanol-pi2/
├── index.html     # Interfaz, secciones y controles
├── style.css      # Diseño y adaptación móvil
├── app.js         # Cálculos, eventos, visualización y exportación
├── data.js        # Datos del caso, supuestos, actores, vínculos y Canvas
├── README.md      # Instalación, modelo, límites y personalización
└── LICENSE        # Licencia del código de esta reconstrucción
```

No hay paquetes `npm`, frameworks, credenciales, `iframe` externos ni enlaces dependientes de Claude. La página es completamente autónoma.

## Publicar en GitHub

1. En GitHub, crea un repositorio nuevo; por ejemplo, `Simulador_Interesados_PI2` (público si quieres usar GitHub Pages gratuito con las condiciones habituales de GitHub).
2. Selecciona **Add file → Upload files** y carga los seis archivos **directamente en la raíz** del repositorio, sin la carpeta contenedora.
3. Pulsa **Commit changes**.
4. Para crear una URL pública, abre **Settings → Pages** y en *Build and deployment* selecciona **Deploy from a branch**, rama `main` y carpeta `/(root)`; guarda.
5. Cuando GitHub indique que terminó la publicación, abre la URL mostrada en **Pages**. No adivines la URL: GitHub mostrará la correspondiente a la cuenta y repositorio.

La aplicación también funciona localmente abriendo `index.html` en Chrome, Edge o Firefox. Si algún navegador bloquea descargas de archivos desde `file://`, pruébala publicada en GitHub Pages.

## Qué se puede hacer

- Cambiar poder (P), interés (I), postura (A) y vinculación (E) para cada actor.
- Excluir/reincorporar y restablecer actores; comparar con valores de referencia.
- Consultar un mapa de burbujas de poder e interés y detectar brechas.
- Analizar la solidez de supuestos conectados con el Canvas.
- Editar los vínculos **supuesto–actor**, los parámetros `k`, `β` y los umbrales.
- Comparar PI-1, PI-2 inicial, PI-2 con plan y hasta cuatro escenarios guardados en memoria de la página.
- Cambiar a la variante alimentaria para ilustrar una barrera técnica que no se resuelve solo con gestionar interesados.
- Registrar una decisión en la tarjeta de salida, copiarla y exportar/importar un escenario completo en JSON.
- Usar un temporizador de 15 minutos.

**Persistencia:** los escenarios guardados mediante *Guardar escenario actual* existen mientras la pestaña está abierta. Para conservarlos entre sesiones, usa **Exportar escenario JSON** y después **Importar JSON**. El archivo se guarda en el equipo, no en GitHub automáticamente.

## Datos que se pueden modificar

Edita `data.js`:

- `meta`: título, información del proyecto, indicadores.
- `actors`: participantes y sus valores de P (1–5), I (1–5), A (−2 a +2), E (0–4).
- `assumptions`: supuestos y su relación con bloques del Canvas. La variante alimentaria usa la entrada `C4b` en lugar de `C4`.
- `links`: qué actores pueden confirmar o invalidar un supuesto.
- `canvas`: bloques y referencias a supuestos.

**Para un proyecto real de Grupo Kopelle:** reemplaza los actores, los supuestos, los vínculos y el Canvas mediante evidencia del proyecto. Si cambias la cantidad de supuestos o actores, el simulador se adapta; si deseas cambiar la lógica especial `C4b` o los escenarios fijos, deberás modificar `app.js` (funciones `activeAssumptions`, `calculate` y objeto `defaults`). No mantengas cifras o umbrales de demostración como si fueran datos de Kopelle.

## Modelo matemático propuesto

Estas son **reglas heurísticas propias de esta reconstrucción**, no fórmulas confirmadas de la fuente original.

### 1. Nivel requerido R

`R = mín(4, 1 + B1 + B2 + B3)`

- `B1 = 1` si `P >= 4` o `I >= 4`, en caso contrario 0.
- `B2 = 1` si `P >= 4` **e** `I >= 4`, en caso contrario 0.
- `B3 = 1` si `P >= 4` y `A < 0`, en caso contrario 0.

Interpretación: `R=1` informar; `R=2` consultar; `R=3` involucrar; `R=4` colaborar. `E` es el nivel gestionado por el equipo (0–4).

### 2. Brecha

`brecha = máx(0, R - E)`

Si se excluye un actor, el escenario predeterminado lo deja con `E = 0`. En las opciones puede desactivarse totalmente su influencia para comparar el efecto de un mapa incompleto (no recomendado para una evaluación del mundo real).

### 3. Penalidad por actor

`d = k × (P / 5) × [0,25 + 0,20 × (2 − A)] × [1 + β × brecha]`

Dónde:

| Símbolo | Interpretación | Escala/valor inicial |
|---|---|---|
| P | Poder del actor | 1 a 5 |
| I | Interés del actor | 1 a 5 |
| A | Postura | −2 (oposición activa) a +2 (apoyo activo) |
| E | Vinculación actual | 0 (sin gestión) a 4 (colaborar) |
| R | Vinculación requerida | 1 a 4 |
| k | Peso de exposición | 15 (ajustable) |
| β | Intensidad de la penalidad por brecha | 0,5 (ajustable) |
| d | Puntos de penalización | puntos de solidez |

### 4. Solidez por supuesto

`S = máx(0, mín(100, 100 − suma(d de actores vinculados)))`

- **Reforzado:** `S >= 70` (umbral superior ajustable).
- **Frágil:** `40 <= S < 70` (umbrales ajustables).
- **Debilitado:** `S < 40` (umbral inferior ajustable).

**Variante `C4b`:** `S_final = mín(25, S)` como representación **pedagógica** de una restricción de evidencia que no se soluciona solo con involucramiento. Este techo NO determina peligrosidad ni seguridad alimentaria; esas conclusiones exigirían estudios experimentales y regulación aplicable.

### 5. Interpretación y límites

La solidez es un **índice relativo creado para enseñar sensibilidad a las decisiones de vinculación**. Una puntuación de 80/100 no significa “80 % de probabilidad de éxito”. La relación actor–supuesto es una hipótesis de influencia y debe validarse. No hay calibración ni pruebas de validez predictiva; los resultados cambian mucho según `k`, `β` y la matriz.

## Procedencia de conceptos

- Artefacto web del taller «Simulador del cardanol», correspondiente a PI-2, Semana 1. Se utilizaron la descripción visible, los nombres de las secciones y la lógica explicada en pantalla como **referencia funcional**; no se extrajo el código fuente.
- Material de la sesión sincrónica, Semana 1, Proyecto Integrador 2: escalas de interesados, Canvas, supuestos y ejemplo del proyecto de cardanol.
- El artefacto menciona Cruz-Reina et al. (2023) como fuente del rendimiento de pirólisis; esa referencia bibliográfica **no ha sido verificada exhaustivamente aquí** y no se incluye como cita bibliográfica completa.

## Alcance del trabajo académico

El entregable de la Semana 1 no debería consistir solo en mostrar este prototipo. El valor está en **defender con evidencia** quién puede bloquear el proyecto, qué supuestos del Canvas dependen de cada actor, qué brechas son prioritarias y cuáles son las decisiones de vinculación justificadas. Esta plantilla puede apoyar la discusión, pero no reemplaza la argumentación del equipo.

## Privacidad y seguridad

- No se usan bases de datos, servidores propios, rastreadores ni claves.
- Todo cálculo ocurre en el navegador.
- No se recomienda agregar al `data.js` datos confidenciales de personas, clientes o proyectos si el repositorio es público.
- La importación valida el formato esperado y los rangos de entrada; solo importa archivos JSON con el identificador `simulador-cardanol-pi2`.

## Licencia

Código original de esta reconstrucción distribuido bajo licencia MIT (archivo `LICENSE`). La licencia no cubre derechos de terceros sobre el artefacto de referencia ni contenidos bibliográficos externos.
