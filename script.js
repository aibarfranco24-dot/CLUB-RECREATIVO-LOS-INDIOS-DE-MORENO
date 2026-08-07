// 1. Estado inicial
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// 2. Función para pintar el carrito en pantalla
function renderizarCarrito() {
    const lista = document.getElementById('lista-carrito');
    const totalSpan = document.getElementById('total-carrito');
    const contadorMenu = document.getElementById('contador-carrito');
    
    if (lista) lista.innerHTML = '';
    let total = 0;

    carrito.forEach((prod, index) => {
        // Soporte compatible tanto para el formato nuevo como por si quedó alguno viejo
        let nombreMostrado = prod.nombreBase ? `${prod.nombreBase} (Talle: ${prod.talle})` : prod.nombre;
        
        total += (prod.precio * prod.cantidad);
        
        if (lista) {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="item-carrito">
                    <span class="nombre-producto">${nombreMostrado} - $${(prod.precio * prod.cantidad).toFixed(2)}</span>
                    
                    <div class="controles">
                        <button onclick="cambiarCantidad(${index}, -1)" class="btn-control">-</button>
                        <span class="cantidad">${prod.cantidad}</span>
                        <button onclick="cambiarCantidad(${index}, 1)" class="btn-control">+</button>
                        <button onclick="eliminarProducto(${index})" class="btn-eliminar">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
            lista.appendChild(li);
        }
    });

    if (totalSpan) totalSpan.textContent = total.toFixed(2);
    if (contadorMenu) contadorMenu.textContent = "(" + carrito.length + ")";
    
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

// Función para ajustar cantidades
function cambiarCantidad(index, cambio) {
    const producto = carrito[index];
    
    if (cambio > 0) {
        // Calculamos el total actual en el carrito excluyendo este ítem para ver cuánto margen queda
        let unidadesOtras = carrito
            .filter((p, i) => p.nombreBase === producto.nombreBase && i !== index)
            .reduce((sum, p) => sum + p.cantidad, 0);

        if (unidadesOtras + producto.cantidad + 1 > producto.stock) {
            Swal.fire({ 
                icon: 'error', 
                title: 'Límite alcanzado', 
                text: `No puedes superar el stock total de ${producto.stock} unidades para este producto.`, 
                background: '#1a1a1a', 
                color: '#ffffff' 
            });
            return;
        }
        producto.cantidad += 1;
    } else if (cambio < 0) {
        producto.cantidad -= 1;
        if (producto.cantidad <= 0) {
            carrito.splice(index, 1);
        }
    }
    
    renderizarCarrito();
}

// 1. Agregar al carrito con validación estricta de stock global (todos los talles combinados)
function agregarAlCarritoConTalle(nombre, precio, stockTotalProducto, index) {
    const selectTalle = document.getElementById(`talle-${index}`);
    const talleSeleccionado = selectTalle ? selectTalle.value : 'Único';

    let totalUnidadesEnCarrito = carrito
        .filter(p => p.nombreBase === nombre)
        .reduce((sum, p) => sum + p.cantidad, 0);

    if (totalUnidadesEnCarrito >= stockTotalProducto) {
        Swal.fire({ 
            icon: 'error', 
            title: 'Stock agotado', 
            text: `Solo hay ${stockTotalProducto} unidades disponibles en total para este producto.`, 
            background: '#1a1a1a', 
            color: '#ffffff' 
        });
        return;
    }

    let productoExistente = carrito.find(p => p.nombreBase === nombre && p.talle === talleSeleccionado);

    if (productoExistente) {
        productoExistente.cantidad += 1;
    } else {
        carrito.push({
            nombreBase: nombre,
            talle: talleSeleccionado,
            precio: parseFloat(precio),
            cantidad: 1,
            stock: stockTotalProducto
        });
    }
    
    renderizarCarrito();
    
    Swal.fire({
        toast: true, position: 'top-end', icon: 'success', title: `${nombre} (${talleSeleccionado}) agregado`,
        showConfirmButton: false, timer: 1500, background: '#1a1a1a', color: '#ffffff'
    });
}

// 2. Controlar la cantidad mediante los botones de más (+) y menos (-)
function cambiarCantidad(index, cambio) {
    const producto = carrito[index];
    
    if (cambio > 0) {
        let unidadesOtras = carrito
            .filter((p, i) => p.nombreBase === producto.nombreBase && i !== index)
            .reduce((sum, p) => sum + p.cantidad, 0);

        if (unidadesOtras + producto.cantidad + 1 > producto.stock) {
            Swal.fire({ 
                icon: 'error', 
                title: 'Límite alcanzado', 
                text: `No puedes superar el stock total de ${producto.stock} unidades para este producto.`, 
                background: '#1a1a1a', 
                color: '#ffffff' 
            });
            return;
        }
        producto.cantidad += 1;
    } else if (cambio < 0) {
        producto.cantidad -= 1;
        if (producto.cantidad <= 0) {
            carrito.splice(index, 1);
        }
    }
    
    renderizarCarrito();
}

// 3. Eliminar un producto específico desde el tacho de basura
function eliminarProducto(index) {
    carrito.splice(index, 1);
    renderizarCarrito();
}

// 4. Vaciar todo el carrito por completo y limpiar la memoria
function vaciarCarrito() {
    carrito = [];
    localStorage.removeItem('carrito');
    renderizarCarrito();
}

// 5. Carga de productos desde el archivo JSON local
fetch('productos.json')
    .then(res => res.json())
    .then(prods => {
        const contenedor = document.getElementById('lista-productos');
        if (!contenedor) return;
        
        contenedor.innerHTML = '';
        prods.forEach((p, index) => {
            // Genera el selector de talles si el producto tiene talles definidos
            let opcionesTalles = '';
            if (p.talles && p.talles.length > 0) {
                opcionesTalles = `<select id="talle-${index}" class="select-talle">` + 
                    p.talles.map(t => `<option value="${t}">${t}</option>`).join('') + 
                    `</select>`;
            }

            contenedor.innerHTML += `
                <div class="producto">
                    <img src="imagenes/${p.imagen}" alt="${p.nombre}" style="width: 150px; display: block; margin: 0 auto;"> 
                    <h3>${p.nombre}</h3>
                    <p>Disponibles: ${p.stock}</p> 
                    <p>$${p.precio}</p>
                    ${opcionesTalles}
                    <button onclick="agregarAlCarritoConTalle('${p.nombre}', ${p.precio}, ${p.stock}, ${index})">Comprar</button>
                </div>
            `;
        });
    })
    .catch(err => console.error('Error al cargar productos:', err));

// 6. Finalizar compra y manejo del formulario
function finalizarCompra() {
    if (carrito.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Tu carrito está vacío.', background: '#1a1a1a', color: '#ffffff' });
        return;
    }
    document.getElementById('formulario-pedido').style.display = 'block';
    document.getElementById('btn-finalizar').style.display = 'none'; 
}

function toggleDireccion() {
    const metodo = document.getElementById('metodo-entrega').value;
    const contenedorDireccion = document.getElementById('contenedor-direccion');
    
    if (contenedorDireccion) {
        if (metodo === 'envio') {
            contenedorDireccion.style.display = 'block';
        } else {
            contenedorDireccion.style.display = 'none';
            const inputDir = document.getElementById('direccion-cliente');
            if (inputDir) inputDir.value = ''; 
        }
    }
}

function cerrarFormulario() {
    document.getElementById('formulario-pedido').style.display = 'none';
    document.getElementById('btn-finalizar').style.display = 'inline-block';
}

function confirmarPedido() {
    const nombre = document.getElementById('nombre-cliente').value.trim();
    const telefono = document.getElementById('telefono-cliente').value.trim();
    const metodo = document.getElementById('metodo-entrega').value;
    const direccionInput = document.getElementById('direccion-cliente');
    const direccion = direccionInput ? direccionInput.value.trim() : '';
    
    const numeroTarjeta = document.getElementById('tarjeta-numero') ? document.getElementById('tarjeta-numero').value.trim() : '';
    const expiracion = document.getElementById('tarjeta-fecha') ? document.getElementById('tarjeta-fecha').value.trim() : '';
    const cvv = document.getElementById('tarjeta-cvv') ? document.getElementById('tarjeta-cvv').value.trim() : '';

    if (!nombre || !telefono || !numeroTarjeta || !expiracion || !cvv) {
        Swal.fire({ 
            icon: 'error', 
            title: 'Campos incompletos', 
            text: 'Por favor completa todos los datos personales y de pago.', 
            background: '#1a1a1a', 
            color: '#ffffff' 
        });
        return;
    }

    if (metodo === 'envio' && !direccion) {
        Swal.fire({ 
            icon: 'error', 
            title: 'Dirección faltante', 
            text: 'Por favor ingresa tu dirección para el envío a domicilio.', 
            background: '#1a1a1a', 
            color: '#ffffff' 
        });
        return;
    }

    let detalleProductos = carrito.map(p => `${p.cantidad}x ${p.nombre} ($${p.precio * p.cantidad})`).join(', ');
    let totalCompra = carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);

    const datosFormulario = {
        nombre: nombre,
        telefono: telefono,
        metodoEntrega: metodo,
        direccion: metodo === 'envio' ? direccion : 'Retira en el club',
        productos: detalleProductos,
        total: `$${totalCompra}`
    };

    fetch('https://formspree.io/f/xlgylaqy', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosFormulario)
    })
    .then(response => {
        if (response.ok) {
            Swal.fire({
                title: '¡Compra confirmada!',
                text: `Gracias ${nombre}. Tu pedido fue enviado con éxito.`,
                icon: 'success', background: '#1a1a1a', color: '#ffffff'
            });
            vaciarCarrito();
            document.getElementById('formulario-pedido').style.display = 'none';
            document.getElementById('btn-finalizar').style.display = 'inline-block';
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Hubo un problema al enviar el pedido.', background: '#1a1a1a', color: '#ffffff' });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo conectar con el servidor.', background: '#1a1a1a', color: '#ffffff' });
    });
}   

// 7. Función para el menú hamburguesa y cierre automático
function toggleMenu() {
    const menu = document.getElementById('menu-desplegable');
    if (menu) {
        menu.classList.toggle('activo');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Cerrar menú al hacer clic en un enlace
    const enlacesMenu = document.querySelectorAll('#menu-desplegable a');
    const menu = document.getElementById('menu-desplegable');

    enlacesMenu.forEach(enlace => {
        enlace.addEventListener('click', () => {
            if (menu && menu.classList.contains('activo')) {
                menu.classList.remove('activo');
            }
        });
    });

    // 1. Teléfono: solo números y máximo 15 dígitos
    const telInput = document.getElementById('telefono-cliente');
    if (telInput) {
        telInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 15);
        });
    }

    // 2. Número de tarjeta: solo números y máximo 16 dígitos
    const tarjetaInput = document.getElementById('tarjeta-numero');
    if (tarjetaInput) {
        tarjetaInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 16);
        });
    }

    // 3. Fecha MM/AA: formato automático con barra y máximo 5 caracteres
    const fechaInput = document.getElementById('tarjeta-fecha');
    if (fechaInput) {
        fechaInput.addEventListener('input', (e) => {
            let valor = e.target.value.replace(/[^0-9]/g, '');
            if (valor.length > 2) {
                valor = valor.slice(0, 2) + '/' + valor.slice(2, 5);
            }
            e.target.value = valor.slice(0, 5);
        });
    }

    // 4. CVV: solo números y máximo 4 dígitos
    const cvvInput = document.getElementById('tarjeta-cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
        });
    }
    
    renderizarCarrito();

// boton volver arriba suave
window.addEventListener('scroll', function() {
    const btnArriba = document.getElementById('btn-volver-arriba');
    
    // Calculamos si el usuario llegó casi al final de la página (a unos 100px del fondo)
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 150) {
        btnArriba.classList.add('mostrar');
    } else {
        btnArriba.classList.remove('mostrar');
    }
});

document.getElementById('btn-volver-arriba').addEventListener('click', function(e) {
    e.preventDefault();
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

});