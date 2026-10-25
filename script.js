
// ===========================================
// ECOPC GUAYARAMERÍN
// Proyecto BTH - Sistemas Informáticos
// ===========================================

"use strict";

const CLAVE_EQUIPOS = "ecopc_equipos_v1";
const CLAVE_SOLICITUDES = "ecopc_solicitudes_v1";

const $ = (selector) => document.querySelector(selector);

function leerDatos(clave) {
  try {
    const datos = JSON.parse(localStorage.getItem(clave) || "[]");
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.error("Error al leer datos:", error);
    return [];
  }
}

let equipos = leerDatos(CLAVE_EQUIPOS);
let solicitudes = leerDatos(CLAVE_SOLICITUDES);

function guardarDatos(clave, datos) {
  try {
    localStorage.setItem(clave, JSON.stringify(datos));
    return true;
  } catch (error) {
    console.error("Error al guardar:", error);
    mostrarToast("No se pudo guardar. Revisa el almacenamiento.");
    return false;
  }
}

function crearId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) +
    Math.random().toString(36).slice(2);
}

function textoSeguro(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[caracter]);
}

function mostrarToast(mensaje) {
  const toast = $("#toast");
  toast.textContent = mensaje;
  toast.classList.add("show");
  clearTimeout(mostrarToast.temporizador);
  mostrarToast.temporizador = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

function mostrarMensaje(selector, mensaje, tipo = "success") {
  const elemento = $(selector);
  elemento.textContent = mensaje;
  elemento.className = "form-message " + tipo;
}

// ===========================================
// MENÚ RESPONSIVO
// ===========================================

const menuToggle = $("#menuToggle");
const navLinks = $("#navLinks");

menuToggle.addEventListener("click", () => {
  const abierto = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(abierto));
  menuToggle.setAttribute(
    "aria-label",
    abierto ? "Cerrar menú" : "Abrir menú"
  );
  menuToggle.textContent = abierto ? "✕" : "☰";
});

document.querySelectorAll(".nav-links a").forEach(enlace => {
  enlace.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menú");
    menuToggle.textContent = "☰";
  });
});

// ===========================================
// REGISTRO DE EQUIPOS
// ===========================================

const equipoForm = $("#equipoForm");

equipoForm.addEventListener("submit", function(evento) {
  evento.preventDefault();

  if (!equipoForm.reportValidity()) return;

  const idExistente = $("#equipoId").value;
  const registroAnterior = equipos.find(e => e.id === idExistente);

  const equipo = {
    id: idExistente || crearId(),
    tipo: $("#tipo").value,
    marca: $("#marca").value.trim(),
    estado: $("#estado").value,
    destino: $("#destino").value,
    descripcion: $("#descripcion").value.trim(),
    responsable: $("#responsable").value.trim(),
    fecha: registroAnterior?.fecha || new Date().toISOString()
  };

  if (!equipo.marca || !equipo.descripcion || !equipo.responsable) {
    mostrarMensaje(
      "#equipoMensaje",
      "Completa correctamente los campos.",
      "error"
    );
    return;
  }

  const nuevaLista = idExistente
    ? equipos.map(e => e.id === idExistente ? equipo : e)
    : [equipo, ...equipos];

  if (!guardarDatos(CLAVE_EQUIPOS, nuevaLista)) return;

  equipos = nuevaLista;
  cancelarEdicion();
  renderizarEquipos();
  actualizarEstadisticas();

  mostrarMensaje(
    "#equipoMensaje",
    idExistente
      ? "Equipo actualizado correctamente."
      : "Equipo registrado correctamente."
  );

  mostrarToast("Registro guardado correctamente.");
});

function cancelarEdicion() {
  equipoForm.reset();
  $("#equipoId").value = "";
  $("#submitEquipo").textContent = "Guardar equipo";
  $("#cancelarEdicion").classList.add("hidden");
}

$("#cancelarEdicion").addEventListener("click", () => {
  cancelarEdicion();
  mostrarMensaje("#equipoMensaje", "");
});

// ===========================================
// CATÁLOGO DE COMPUTADORAS
// ===========================================

function iconoEquipo(tipo) {
  if (tipo === "Computadora portátil") return "💻";
  if (tipo === "Monitor") return "🖥️";
  if (tipo === "Teclado") return "⌨️";
  if (tipo === "Otro periférico") return "🖱️";
  return "🖥️";
}

function claseEstado(estado) {
  if (estado === "Funcional") return "funcional";
  if (estado === "Reparable") return "reparable";
  return "evaluacion";
}

function fechaLegible(fecha) {
  const fechaObjeto = new Date(fecha);
  return Number.isNaN(fechaObjeto.getTime())
    ? "Sin fecha"
    : fechaObjeto.toLocaleDateString("es-BO");
}

function renderizarEquipos() {
  const contenedor = $("#listaEquipos");
  const busqueda = $("#buscarEquipo").value
    .toLocaleLowerCase("es")
    .trim();
  const filtro = $("#filtrarEstado").value;

  const filtrados = equipos.filter(equipo => {
    const contenido = [
      equipo.tipo,
      equipo.marca,
      equipo.descripcion,
      equipo.destino
    ].join(" ").toLocaleLowerCase("es");

    return contenido.includes(busqueda) &&
      (filtro === "Todos" || equipo.estado === filtro);
  });

  if (filtrados.length === 0) {
    contenedor.innerHTML = `
      <div class="empty-state">
        <h3>🌱 No hay equipos para mostrar</h3>
        <p>Registra un equipo o modifica los filtros de búsqueda.</p>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = filtrados.map(equipo => `
    <article class="equipment-card">
      <div class="equipment-visual">
        ${iconoEquipo(equipo.tipo)}
      </div>
      <div class="equipment-body">
        <span class="status ${claseEstado(equipo.estado)}">
          ${textoSeguro(equipo.estado)}
        </span>

        <h3>${textoSeguro(equipo.tipo)}</h3>
        <p><strong>Marca:</strong> ${textoSeguro(equipo.marca)}</p>
        <p>${textoSeguro(equipo.descripcion)}</p>
        <p><strong>Destino:</strong> ${textoSeguro(equipo.destino)}</p>

        <div class="equipment-meta">
          Registrado: ${fechaLegible(equipo.fecha)}
        </div>

        <div class="equipment-actions">
          <button class="small-btn" data-accion="editar"
            data-id="${textoSeguro(equipo.id)}">
            Editar
          </button>
          <button class="small-btn danger" data-accion="eliminar"
            data-id="${textoSeguro(equipo.id)}">
            Eliminar
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

$("#buscarEquipo").addEventListener("input", renderizarEquipos);
$("#filtrarEstado").addEventListener("change", renderizarEquipos);

$("#listaEquipos").addEventListener("click", evento => {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;

  const id = boton.dataset.id;

  if (boton.dataset.accion === "editar") {
    editarEquipo(id);
  } else if (boton.dataset.accion === "eliminar") {
    eliminarEquipo(id);
  }
});

function editarEquipo(id) {
  const equipo = equipos.find(e => e.id === id);
  if (!equipo) return;

  $("#equipoId").value = equipo.id;
  $("#tipo").value = equipo.tipo;
  $("#marca").value = equipo.marca;
  $("#estado").value = equipo.estado;
  $("#destino").value = equipo.destino;
  $("#descripcion").value = equipo.descripcion;
  $("#responsable").value = equipo.responsable;
  $("#consentimiento").checked = false;

  $("#submitEquipo").textContent = "Actualizar equipo";
  $("#cancelarEdicion").classList.remove("hidden");
  mostrarMensaje("#equipoMensaje", "Editando registro.");

  document.querySelector("#donar").scrollIntoView({
    behavior: "smooth"
  });
}

function eliminarEquipo(id) {
  const equipo = equipos.find(e => e.id === id);
  if (!equipo) return;

  const confirmado = confirm(
    `¿Deseas eliminar el equipo ${equipo.marca} del catálogo?`
  );

  if (!confirmado) return;

  const nuevaLista = equipos.filter(e => e.id !== id);

  if (!guardarDatos(CLAVE_EQUIPOS, nuevaLista)) return;

  equipos = nuevaLista;

  if ($("#equipoId").value === id) cancelarEdicion();

  renderizarEquipos();
  actualizarEstadisticas();
  mostrarToast("Equipo eliminado correctamente.");
}

// ===========================================
// SOLICITUDES DE EQUIPOS
// ===========================================

$("#solicitudForm").addEventListener("submit", function(evento) {
  evento.preventDefault();

  if (!this.reportValidity()) return;

  const cantidad = Number($("#cantidad").value);

  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 100) {
    mostrarMensaje(
      "#solicitudMensaje",
      "La cantidad debe estar entre 1 y 100.",
      "error"
    );
    return;
  }

  const solicitud = {
    id: crearId(),
    institucion: $("#institucion").value.trim(),
    responsable: $("#solicitante").value.trim(),
    cantidad: cantidad,
    motivo: $("#motivo").value.trim(),
    estado: "Pendiente",
    fecha: new Date().toISOString()
  };

  if (!solicitud.institucion ||
      !solicitud.responsable ||
      !solicitud.motivo) {
    mostrarMensaje(
      "#solicitudMensaje",
      "Completa los campos obligatorios.",
      "error"
    );
    return;
  }

  const nuevaLista = [solicitud, ...solicitudes];

  if (!guardarDatos(CLAVE_SOLICITUDES, nuevaLista)) return;

  solicitudes = nuevaLista;
  this.reset();
  actualizarEstadisticas();

  mostrarMensaje(
    "#solicitudMensaje",
    "Solicitud guardada localmente. No implica una donación confirmada."
  );

  mostrarToast("Solicitud registrada correctamente.");
});

// ===========================================
// ESTADÍSTICAS DINÁMICAS
// ===========================================

function actualizarEstadisticas() {
  const total = equipos.length;
  const funcionales = equipos.filter(
    e => e.estado === "Funcional"
  ).length;
  const reparables = equipos.filter(
    e => e.estado === "Reparable"
  ).length;
  const evaluacion = equipos.filter(
    e => e.estado === "Evaluación"
  ).length;

  $("#totalEquipos").textContent = total;
  $("#totalFuncionales").textContent = funcionales;
  $("#totalReparables").textContent = reparables;
  $("#totalSolicitudes").textContent = solicitudes.length;

  function actualizarBarra(idBarra, idTexto, cantidad) {
    const porcentaje = total === 0
      ? 0
      : Math.round((cantidad / total) * 100);

    $(idBarra).style.width = porcentaje + "%";
    $(idTexto).textContent = porcentaje + "%";
  }

  actualizarBarra(
    "#barraFuncionales",
    "#porcentajeFuncionales",
    funcionales
  );

  actualizarBarra(
    "#barraReparables",
    "#porcentajeReparables",
    reparables
  );

  actualizarBarra(
    "#barraEvaluacion",
    "#porcentajeEvaluacion",
    evaluacion
  );
}

// ===========================================
// EXPORTAR RESPALDO JSON
// ===========================================

$("#exportarDatos").addEventListener("click", () => {
  const respaldo = {
    aplicacion: "EcoPC Guayaramerín",
    version: 1,
    fechaExportacion: new Date().toISOString(),
    equipos: equipos,
    solicitudes: solicitudes
  };

  const archivo = new Blob(
    [JSON.stringify(respaldo, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = "respaldo-ecopc.json";
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  mostrarMensaje(
    "#datosMensaje",
    "Respaldo generado. Guárdalo en un lugar seguro."
  );
});

// ===========================================
// IMPORTAR RESPALDO JSON
// ===========================================

function validarEquipo(e) {
  const tipos = [
    "Computadora de escritorio",
    "Computadora portátil",
    "Monitor",
    "Teclado",
    "Otro periférico"
  ];

  const estados = ["Funcional", "Reparable", "Evaluación"];

  const destinos = [
    "Disponible para donación",
    "Reutilización personal",
    "Evaluación técnica"
  ];

  return e && typeof e === "object" &&
    typeof e.id === "string" &&
    e.id.length > 0 && e.id.length <= 100 &&
    tipos.includes(e.tipo) &&
    estados.includes(e.estado) &&
    destinos.includes(e.destino) &&
    typeof e.marca === "string" && e.marca.length <= 60 &&
    typeof e.descripcion === "string" &&
    e.descripcion.length <= 400 &&
    typeof e.responsable === "string" &&
    e.responsable.length <= 80 &&
    typeof e.fecha === "string";
}

function validarSolicitud(s) {
  return s && typeof s === "object" &&
    typeof s.id === "string" &&
    s.id.length > 0 && s.id.length <= 100 &&
    typeof s.institucion === "string" &&
    s.institucion.length <= 100 &&
    typeof s.responsable === "string" &&
    s.responsable.length <= 80 &&
    Number.isInteger(s.cantidad) &&
    s.cantidad >= 1 && s.cantidad <= 100 &&
    typeof s.motivo === "string" &&
    s.motivo.length <= 400 &&
    s.estado === "Pendiente" &&
    typeof s.fecha === "string";
}

$("#importarDatos").addEventListener("change", async function() {
  const archivo = this.files[0];
  if (!archivo) return;

  try {
    if (archivo.size > 2 * 1024 * 1024) {
      throw new Error("El archivo supera el límite de 2 MB.");
    }

    const contenido = await archivo.text();
    const respaldo = JSON.parse(contenido);

    if (!respaldo ||
        respaldo.aplicacion !== "EcoPC Guayaramerín" ||
        respaldo.version !== 1 ||
        !Array.isArray(respaldo.equipos) ||
        !Array.isArray(respaldo.solicitudes) ||
        respaldo.equipos.length > 5000 ||
        respaldo.solicitudes.length > 5000 ||
        !respaldo.equipos.every(validarEquipo) ||
        !respaldo.solicitudes.every(validarSolicitud)) {
      throw new Error("El respaldo no tiene un formato válido.");
    }

    const idsEquipos = respaldo.equipos.map(e => e.id);
    const idsSolicitudes = respaldo.solicitudes.map(s => s.id);

    if (new Set(idsEquipos).size !== idsEquipos.length ||
        new Set(idsSolicitudes).size !== idsSolicitudes.length) {
      throw new Error("El respaldo contiene identificadores repetidos.");
    }

    if (!confirm(
      "La importación reemplazará los registros actuales. " +
      "¿Deseas continuar?"
    )) return;

    const respaldoAnteriorEquipos = localStorage.getItem(CLAVE_EQUIPOS);
    const respaldoAnteriorSolicitudes = localStorage.getItem(CLAVE_SOLICITUDES);

    try {
      localStorage.setItem(
        CLAVE_EQUIPOS,
        JSON.stringify(respaldo.equipos)
      );
      localStorage.setItem(
        CLAVE_SOLICITUDES,
        JSON.stringify(respaldo.solicitudes)
      );
    } catch (error) {
      try {
        if (respaldoAnteriorEquipos === null) {
          localStorage.removeItem(CLAVE_EQUIPOS);
        } else {
          localStorage.setItem(
            CLAVE_EQUIPOS,
            respaldoAnteriorEquipos
          );
        }

        if (respaldoAnteriorSolicitudes === null) {
          localStorage.removeItem(CLAVE_SOLICITUDES);
        } else {
          localStorage.setItem(
            CLAVE_SOLICITUDES,
            respaldoAnteriorSolicitudes
          );
        }
      } catch (restauracionError) {
        console.error("No se pudo restaurar:", restauracionError);
      }
      throw new Error("No se pudo guardar el respaldo importado.");
    }

    equipos = respaldo.equipos;
    solicitudes = respaldo.solicitudes;

    cancelarEdicion();
    renderizarEquipos();
    actualizarEstadisticas();

    mostrarMensaje(
      "#datosMensaje",
      "Respaldo importado correctamente."
    );
    mostrarToast("Datos restaurados.");

  } catch (error) {
    mostrarMensaje(
      "#datosMensaje",
      error.message || "Error al importar el archivo.",
      "error"
    );
  } finally {
    this.value = "";
  }
});

// ===========================================
// INICIALIZACIÓN
// ===========================================

function iniciarAplicacion() {
  $("#anioActual").textContent = new Date().getFullYear();
  renderizarEquipos();
  actualizarEstadisticas();
}

iniciarAplicacion();
