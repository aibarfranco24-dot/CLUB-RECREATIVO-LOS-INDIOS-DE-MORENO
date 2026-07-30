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
        total += (prod.precio * prod.cantidad);
        
        if (lista) {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="item-carrito">
                    <span class="nombre-producto">${prod.nombre} - $${(prod.precio * prod.cantidad).toFixed(2)}</span>
                    
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
function cambiarCantidad(index, delta) {
    const prod = carrito[index];
    
    if (delta === 1 && prod.cantidad >= prod.stock) {
        Swal.fire({ icon: 'warning', title: 'Agotado', text: 'Has alcanzado el límite de stock.', background: '#1a1a1a', color: '#ffffff' });
        return;
    }

    prod.cantidad += delta;
    if (prod.cantidad <= 0) {
        eliminarProducto(index);
    } else {
        renderizarCarrito();
    }
}

function eliminarProducto(index) {
    carrito.splice(index, 1); 
    renderizarCarrito();
}

// 3. Función para agregar productos
function agregarAlCarrito(nombre, precio, stockDisponible) {
    const productoExistente = carrito.find(p => p.nombre === nombre);
    const cantidadActual = productoExistente ? productoExistente.cantidad : 0;

    if (cantidadActual + 1 > stockDisponible) {
        Swal.fire({ icon: 'error', title: 'Sin stock', text: 'No hay más unidades disponibles.', background: '#1a1a1a', color: '#ffffff' });
        return;
    }

    if (productoExistente) {
        productoExistente.cantidad += 1;
    } else {
        carrito.push({ nombre: nombre, precio: parseFloat(precio), cantidad: 1, stock: stockDisponible });
    }
    
    renderizarCarrito();
    
    Swal.fire({
        toast: true, position: 'top-end', icon: 'success', title: `${nombre} agregado`,
        showConfirmButton: false, timer: 1500, background: '#1a1a1a', color: '#ffffff'
    });
}

// 4. Función para vaciar
function vaciarCarrito() {
    carrito = [];
    renderizarCarrito();
}

// 5. Carga de productos desde el archivo JSON local
fetch('productos.json')
    .then(res => res.json())
    .then(prods => {
        const contenedor = document.getElementById('lista-productos');
        if (!contenedor) return;
        
        contenedor.innerHTML = '';
        prods.forEach(p => {
            contenedor.innerHTML += `
                <div class="producto">
                    <img src="imagenes/${p.imagen}" alt="${p.nombre}" style="width: 150px; display: block; margin: 0 auto;"> 
                    <h3>${p.nombre}</h3>
                    <p>Disponibles: ${p.stock}</p> 
                    <p>$${p.precio}</p>
                    <button onclick="agregarAlCarrito('${p.nombre}', ${p.precio}, ${p.stock})">Comprar</button>
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

    // Restringir campos de texto para que solo admitan números
    const idsNumericos = ['telefono-cliente', 'tarjeta-numero', 'tarjeta-fecha', 'tarjeta-cvv'];
    
    idsNumericos.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
        }
    });
    
    renderizarCarrito();
});