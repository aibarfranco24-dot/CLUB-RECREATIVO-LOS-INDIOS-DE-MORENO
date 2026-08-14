import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBXOloQzV1lbYK90llREvP6QfINV9ifRM4",
    authDomain: "club-los-indios-308cf.firebaseapp.com",
    projectId: "club-los-indios-308cf",
    storageBucket: "club-los-indios-308cf.firebasestorage.app",
    messagingSenderId: "364857138073",
    appId: "1:364857138073:web:f45eaa3c18638abe7d1108",
    measurementId: "G-Y30GF8TFFD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

// 3. Función para ajustar cantidades
window.cambiarCantidad = function(index, cambio) {
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

// 4. Agregar al carrito con validación de stock
window.agregarAlCarritoConTalle = function(nombre, precio, stockTotalProducto, docId) {
    const selectTalle = document.getElementById(`talle-${docId}`);
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
            id: docId, // Guardamos el ID de Firebase para luego descontar stock correctamente
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

// 5. Eliminar un producto específico
window.eliminarProducto = function(index) {
    carrito.splice(index, 1);
    renderizarCarrito();
}

// 6. Vaciar todo el carrito
window.vaciarCarrito = function() {
    carrito = [];
    localStorage.removeItem('carrito');
    renderizarCarrito();
}

// 7. Carga de productos desde Firebase Firestore
async function cargarProductosDesdeFirebase() {
    try {
        const contenedor = document.getElementById('lista-productos');
        if (!contenedor) return;
        
        contenedor.innerHTML = '<p style="color: white; text-align: center;">Cargando productos...</p>';
        
        const querySnapshot = await getDocs(collection(db, "productos"));
        contenedor.innerHTML = '';

        if (querySnapshot.empty) {
            contenedor.innerHTML = '<p style="color: white; text-align: center;">No hay productos cargados todavía.</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const p = docSnap.data();
            const docId = docSnap.id; 
            
            const tallesDisponibles = p.talles || p.talle || ['S', 'M', 'L', 'XL'];
            let opcionesTalles = `<select id="talle-${docId}" class="select-talle">` + 
                tallesDisponibles.map(t => `<option value="${t}">${t}</option>`).join('') + 
                `</select>`;

            const stock = Math.max(0, p.stock !== undefined ? p.stock : 0);
            const precio = p.precio || 0;
        

            contenedor.innerHTML += `
                <div class="producto">
                    <img src="${p.imagen}" alt="${p.nombre}" style="width: 150px; display: block; margin: 0 auto;" onerror="this.src='imagenes/default.jpg'"> 
                    <h3>${p.nombre}</h3>
                    <p>Disponibles: ${stock}</p> 
                    <p>$${precio}</p>
                    ${opcionesTalles}
                    <button onclick="agregarAlCarritoConTalle('${p.nombre}', ${precio}, ${stock}, '${docId}')">Comprar</button>
                </div>
            `;
        });
    } catch (err) {
        console.error('Error al cargar productos de Firebase:', err);
    }
}

cargarProductosDesdeFirebase();

// 8. Finalizar compra y manejo del formulario
window.finalizarCompra = function() {
    if (carrito.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Tu carrito está vacío.', background: '#1a1a1a', color: '#ffffff' });
        return;
    }
    document.getElementById('formulario-pedido').style.display = 'block';
    document.getElementById('btn-finalizar').style.display = 'none'; 
}

// Función auxiliar para descontar stock en Firebase
async function descontarStock(carritoItems) {
    // 1. Agrupamos las cantidades totales a descontar por ID de producto
    const resumenStock = {};
    
    for (const item of carritoItems) {
        if (!item.id) continue;
        if (!resumenStock[item.id]) {
            resumenStock[item.id] = { stockActual: item.stock, totalComprado: 0 };
        }
        resumenStock[item.id].totalComprado += item.cantidad;
    }

    // 2. Aplicamos el descuento real sumando todas las cantidades compradas por talle
    for (const [idProducto, datos] of Object.entries(resumenStock)) {
        const productoRef = doc(db, "productos", idProducto);
        try {
            // Obtenemos el stock base y le restamos la suma total de lo que compró
            const nuevoStock = Math.max(0, datos.stockActual - datos.totalComprado);
            await updateDoc(productoRef, {
                stock: nuevoStock
            });
        } catch (error) {
            console.error("Error al actualizar el stock del producto:", error);
        }
    }
}

window.toggleDireccion = function() {
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

window.cerrarFormulario = function() {
    document.getElementById('formulario-pedido').style.display = 'none';
    document.getElementById('btn-finalizar').style.display = 'inline-block';
}

window.confirmarPedido = async function() {
    const nombre = document.getElementById('nombre-cliente').value.trim();
    const telefono = document.getElementById('telefono-cliente').value.trim();
    const metodo = document.getElementById('metodo-entrega').value;
    const direccionInput = document.getElementById('direccion-cliente');
    const direccion = direccionInput ? direccionInput.value.trim() : '';
    
    const numeroTarjeta = document.getElementById('tarjeta-numero') ? document.getElementById('tarjeta-numero').value.trim() : '';
    const expiracion = document.getElementById('tarjeta-fecha') ? document.getElementById('tarjeta-fecha').value.trim() : '';
    const cvv = document.getElementById('tarjeta-cvv') ? document.getElementById('tarjeta-cvv').value.trim() : '';

    // Tus alertas originales intactas
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

    let detalleProductos = carrito.map(p => ({
        nombre: p.nombreBase,
        talle: p.talle,
        cantidad: p.cantidad,
        precioUnitario: p.precio,
        subtotal: p.precio * p.cantidad
    }));
    
    let totalCompra = carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);

    const datosPedido = {
        cliente: nombre,
        telefono: telefono,
        metodoEntrega: metodo,
        direccion: metodo === 'envio' ? direccion : 'Retira en el club',
        productos: detalleProductos,
        total: totalCompra,
        fecha: new Date().toISOString(),
        estado: 'Pendiente'
    };

    try {
       const idPersonalizado = `${nombre}_${Date.now()}`;
        await setDoc(doc(db, "pedidos", idPersonalizado), datosPedido);
     

        // Descuenta el stock de todos los talles de forma agrupada en Firebase
        await descontarStock(carrito);

        let detalleTexto = carrito.map(p => `${p.cantidad}x ${p.nombreBase} (${p.talle}) - $${p.precio * p.cantidad}`).join(', ');
        await fetch('https://formspree.io/f/xlgylaqy', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: nombre,
                telefono: telefono,
                metodoEntrega: metodo,
                direccion: datosPedido.direccion,
                productos: detalleTexto,
                total: `$${totalCompra}`
            })
        });

        // Alerta de éxito con la recarga automática al cerrar
        Swal.fire({
            title: '¡Compra confirmada!',
            text: `Gracias ${nombre}. Tu pedido fue registrado con éxito.`,
            icon: 'success', 
            background: '#1a1a1a', 
            color: '#ffffff',
            didClose: () => {
                location.reload();
            }
        });
        
        vaciarCarrito();

    } catch (error) {
        console.error('Error al guardar el pedido:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo registrar el pedido en la base de datos.', background: '#1a1a1a', color: '#ffffff' });
    }
}


// 9. Eventos generales al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    const enlacesMenu = document.querySelectorAll('#menu-desplegable a');
    const menu = document.getElementById('menu-desplegable');

    enlacesMenu.forEach(enlace => {
        enlace.addEventListener('click', () => {
            if (menu && menu.classList.contains('activo')) {
                menu.classList.remove('activo');
            }
        });
    });

    const telInput = document.getElementById('telefono-cliente');
    if (telInput) {
        telInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 15);
        });
    }

    const tarjetaInput = document.getElementById('tarjeta-numero');
    if (tarjetaInput) {
        tarjetaInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 16);
        });
    }

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

    const cvvInput = document.getElementById('tarjeta-cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
        });
    }
    
    renderizarCarrito();

    // Botón volver arriba
    window.addEventListener('scroll', function() {
        const btnArriba = document.getElementById('btn-volver-arriba');
        if (!btnArriba) return;
        
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;

        if (scrollTop + clientHeight >= scrollHeight - 150) {
            btnArriba.classList.add('mostrar');
        } else {
            btnArriba.classList.remove('mostrar');
        }
    });

    const btnVolver = document.getElementById('btn-volver-arriba');
    if (btnVolver) {
        btnVolver.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
window.toggleMenu = function() {
    const menu = document.getElementById('menu-desplegable');
    if (menu) {
        menu.classList.toggle('activo');
    }
}