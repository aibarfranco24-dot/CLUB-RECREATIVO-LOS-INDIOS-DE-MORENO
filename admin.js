import { db, auth } from "./firebase.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const loginSection = document.getElementById('login-section');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const btnLogout = document.getElementById('btn-logout');
const formNuevoProducto = document.getElementById('form-nuevo-producto');

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.style.display = 'none';
        adminPanel.style.display = 'block';
        cargarProductosAdmin();
    } else {
        loginSection.style.display = 'block';
        adminPanel.style.display = 'none';
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        Swal.fire({ icon: 'success', title: '¡Bienvenido administrador!', timer: 1500, showConfirmButton: false, background: '#1a1a1a', color: '#fff' });
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error de acceso', text: 'Correo o contraseña incorrectos.', background: '#1a1a1a', color: '#fff' });
    }
});

btnLogout.addEventListener('click', async () => {
    await signOut(auth);
});

// Guardar producto
formNuevoProducto.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nuevo-nombre').value;
    const precio = parseFloat(document.getElementById('nuevo-precio').value);
    const imagen = document.getElementById('nuevo-imagen').value || 'imagenes/default.jpg';

    const talleData = {
        S: parseInt(document.getElementById('stock-s').value) || 0,
        M: parseInt(document.getElementById('stock-m').value) || 0,
        L: parseInt(document.getElementById('stock-l').value) || 0,
        XL: parseInt(document.getElementById('stock-xl').value) || 0,
        XXL: parseInt(document.getElementById('stock-xxl').value) || 0
    };

    try {
        await addDoc(collection(db, "productos"), {
            nombre: nombre,
            precio: precio,
            imagen: imagen,
            talle: talleData
        });

        Swal.fire({ icon: 'success', title: '¡Producto creado!', background: '#1a1a1a', color: '#fff' });
        formNuevoProducto.reset();
        cargarProductosAdmin();
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar.', background: '#1a1a1a', color: '#fff' });
    }
});

// Función para cargar los productos actuales dentro del panel con botón de eliminar
async function cargarProductosAdmin() {
    const contenedorAdmin = document.getElementById('lista-productos-admin');
    if (!contenedorAdmin) return;
    
    contenedorAdmin.innerHTML = '<p>Cargando inventario...</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        contenedorAdmin.innerHTML = '';
        
        if (querySnapshot.empty) {
            contenedorAdmin.innerHTML = '<p style="color: #888;">No hay productos cargados todavía.</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const p = docSnap.data();
            const id = docSnap.id; // Obtenemos el ID único del documento en Firestore
            
            contenedorAdmin.innerHTML += `
                <div style="border-bottom: 1px solid #333; padding: 10px 0; display: flex; justify-content: space-between; align-items: center;">
                    <span><b>${p.nombre}</b> - Precio: $${p.precio}</span>
                    <div>
                        <span style="color: #888; font-size: 13px; margin-right: 15px;">Stock configurado</span>
                        <button onclick="window.eliminarProducto('${id}')" style="background: #ff4d4d; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-weight: bold;">Eliminar</button>
                    </div>
                </div>
            `;
        });
    } catch (err) {
        contenedorAdmin.innerHTML = '<p style="color: #ff6b6b;">Error al cargar el inventario.</p>';
    }
}

// Función global para eliminar el producto por su ID
async function eliminarProducto(id) {
    const confirmacion = await Swal.fire({
        title: '¿Estás seguro?',
        text: "¡El producto se eliminará de la base de datos!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff4d4d',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: '#1a1a1a',
        color: '#fff'
    });

    if (confirmacion.isConfirmed) {
        try {
            await deleteDoc(doc(db, "productos", id));
            Swal.fire({
                icon: 'success',
                title: '¡Eliminado!',
                text: 'El producto fue borrado con éxito.',
                background: '#1a1a1a',
                color: '#fff',
                timer: 1500,
                showConfirmButton: false
            });
            cargarProductosAdmin(); // Recarga la lista automáticamente
        } catch (error) {
            console.error("Error al eliminar el producto: ", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el producto.',
                background: '#1a1a1a',
                color: '#fff'
            });
        }
    }
}

// Hacemos que la función sea accesible desde los botones HTML
window.eliminarProducto = eliminarProducto;