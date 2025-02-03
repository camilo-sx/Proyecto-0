document.addEventListener("DOMContentLoaded", () => {
    //const API_BASE_URL = "http://localhost:8000"; desarrollo en local
    const API_BASE_URL = "http://44.208.104.201:8000";


    // Elementos de la navegación
    const navLinks = document.getElementById("nav-links");
    const authLinks = document.getElementById("auth-links");

    // Secciones
    const sections = {
        home: document.getElementById("home-section"),
        register: document.getElementById("register-section"),
        login: document.getElementById("login-section"),
        tasks: document.getElementById("tasks-section"),
        categories: document.getElementById("categories-section"),
        profile: document.getElementById("profile-section"),
    };

    // Token de autenticación
    let token = localStorage.getItem("token");

    // Variable global para almacenar categorías (id -> nombre)
    let categoriesMap = {};

    // Función para manejar respuestas 401 Unauthorized
    const handleUnauthorized = () => {
        alert("Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.");
        logout();
    };

    // Función genérica para realizar solicitudes fetch con autenticación
    const fetchWithAuth = async (url, options = {}) => {
        const defaultHeaders = {
            Authorization: `Bearer ${token}`,
        };

        options.headers = {
            ...defaultHeaders,
            ...options.headers,
        };

        try {
            const response = await fetch(url, options);
            if (response.status === 401) {
                handleUnauthorized();
                throw new Error("Unauthorized");
            }
            return response;
        } catch (error) {
            console.error(`Error en fetch a ${url}:`, error);
            throw error;
        }
    };

    // Función para mostrar una sección y ocultar las demás
    const showSection = (section) => {
        Object.values(sections).forEach((sec) => sec.classList.add("d-none"));

        if (section === "home") {
            if (token) {
                sections["tasks"].classList.remove("d-none");
                loadTasks();
            } else {
                sections["home"].classList.remove("d-none");
            }
        } else if (section === "login" || section === "register") {
            sections[section].classList.remove("d-none");
        } else {
            if (!token) {
                alert("Debes iniciar sesión para acceder a esta sección.");
                showSection("login");
                return;
            }
            sections[section].classList.remove("d-none");
            if (section === "tasks") loadTasks();
            if (section === "categories") loadCategories();
            if (section === "profile") loadProfile();
        }
    };

    // Función para actualizar la navegación según el estado de autenticación
    const updateNav = () => {
        navLinks.innerHTML = "";
        authLinks.innerHTML = "";

        if (token) {
            navLinks.innerHTML += `
                <li class="nav-item">
                    <a class="nav-link" href="#" data-section="tasks">Tareas</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" data-section="categories">Categorías</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" data-section="profile">Perfil</a>
                </li>
            `;
            authLinks.innerHTML += `
                <li class="nav-item">
                    <a class="nav-link" href="#" id="logout-link">Cerrar Sesión</a>
                </li>
            `;
        } else {
            navLinks.innerHTML += `
                <li class="nav-item">
                    <a class="nav-link" href="#" data-section="home">Inicio</a>
                </li>
            `;
            authLinks.innerHTML += `
                <li class="nav-item">
                    <a class="nav-link" href="#" data-section="login">Iniciar Sesión</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" data-section="register">Registrar</a>
                </li>
            `;
        }

        document.querySelectorAll("[data-section]").forEach((link) => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const section = e.target.getAttribute("data-section");
                showSection(section);
            });
        });

        const logoutLink = document.getElementById("logout-link");
        if (logoutLink) {
            logoutLink.addEventListener("click", (e) => {
                e.preventDefault();
                logout();
            });
        }
    };

    // Función para manejar cambios en la opción de fecha en el formulario crear tarea
    const handleDateOptionChange = () => {
        const dateOption = document.getElementById("task-date-option").value;
        const customDateContainer = document.getElementById("custom-date-container");

        if (dateOption === "custom") {
            customDateContainer.classList.remove("d-none");
            document.getElementById("task-custom-date").required = true;
        } else {
            customDateContainer.classList.add("d-none");
            document.getElementById("task-custom-date").required = false;
        }
    };

    document.getElementById("task-date-option")?.addEventListener("change", handleDateOptionChange);

    // Función para cargar las categorías y poblar los selects de creación y edición
    const loadCategoriesForTasks = async () => {
        try {
            const categoriesResponse = await fetchWithAuth(`${API_BASE_URL}/categorias/`, { method: "GET" });
            if (categoriesResponse.ok) {
                const categories = await categoriesResponse.json();
                categoriesMap = {}; // Reiniciar mapa
                // Poblar mapa y los selects
                const createCategorySelect = document.getElementById("task-category");
                const editCategorySelect = document.getElementById("edit-task-category");
                createCategorySelect.innerHTML = '<option value="">--Sin Categoría--</option>';
                editCategorySelect.innerHTML = '<option value="">--Sin Categoría--</option>';
                categories.forEach((cat) => {
                    categoriesMap[cat.id] = cat.nombre;
                    const option1 = document.createElement("option");
                    option1.value = cat.id;
                    option1.textContent = cat.nombre;
                    createCategorySelect.appendChild(option1);

                    const option2 = document.createElement("option");
                    option2.value = cat.id;
                    option2.textContent = cat.nombre;
                    editCategorySelect.appendChild(option2);
                });
            } else {
                const errorData = await categoriesResponse.json();
                alert(`Error al cargar categorías: ${errorData.detail}`);
            }
        } catch (error) {
            // El manejo de 401 ya se realiza en fetchWithAuth
        }
    };

    // Función para registrar un usuario
    const register = async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (response.ok) {
                alert("Usuario registrado exitosamente. Inicia sesión.");
                showSection("login");
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.detail}`);
            }
        } catch (error) {
            console.error("Error registrando usuario:", error);
            alert("Ocurrió un error al registrar el usuario.");
        }
    };

    document.getElementById("register-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const nombre_usuario = document.getElementById("reg-username").value.trim();
        const contrasenia = document.getElementById("reg-password").value.trim();
        if (!nombre_usuario || !contrasenia) {
            alert("Por favor, completa todos los campos.");
            return;
        }
        register({ nombre_usuario, contrasenia });
    });

    // Función para iniciar sesión
    const login = async (username, password) => {
        try {
            const formData = new URLSearchParams();
            formData.append("username", username);
            formData.append("password", password);
            const response = await fetch(`${API_BASE_URL}/token`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData,
            });
            if (response.ok) {
                const data = await response.json();
                token = data.access_token;
                localStorage.setItem("token", token);
                alert("Inicio de sesión exitoso.");
                updateNav();
                showSection("tasks");
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.detail}`);
            }
        } catch (error) {
            console.error("Error iniciando sesión:", error);
            alert("Ocurrió un error al iniciar sesión.");
        }
    };

    document.getElementById("login-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = document.getElementById("login-username").value.trim();
        const password = document.getElementById("login-password").value.trim();
        if (!username || !password) {
            alert("Por favor, completa todos los campos.");
            return;
        }
        login(username, password);
    });

    // Función para cerrar sesión
    const logout = () => {
        localStorage.removeItem("token");
        token = null;
        alert("Has cerrado sesión.");
        updateNav();
        showSection("home");
    };

    // Función para cargar tareas (se ordenan por fecha de fin)
    const loadTasks = async () => {
        const tasksTable = document.getElementById("tasks-table");
        if (!tasksTable) {
            console.error("Elemento 'tasks-table' no encontrado.");
            alert("Ocurrió un error al cargar las tareas.");
            return;
        }
        tasksTable.innerHTML = "";

        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/`, { method: "GET" });
            if (response.ok) {
                let tasks = await response.json();
                // Cargar categorías (si no se han cargado aún)
                await loadCategoriesForTasks();

                // Ordenar las tareas por fecha tentativa de finalización (las sin fecha al final)
                tasks = tasks.sort((a, b) => {
                    if (!a.fecha_tentativa_finalizacion) return 1;
                    if (!b.fecha_tentativa_finalizacion) return -1;
                    return new Date(a.fecha_tentativa_finalizacion) - new Date(b.fecha_tentativa_finalizacion);
                });

                if (tasks.length === 0) {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `<td colspan="7" class="text-center">No tienes tareas asignadas.</td>`;
                    tasksTable.appendChild(tr);
                } else {
                    tasks.forEach((task) => {
                        const tr = document.createElement("tr");

                        // Formatear la fecha de fin y calcular tiempo restante (si existe)
                        let finalDateStr = "N/A";
                        let timeRemainingStr = "N/A";
                        if (task.fecha_tentativa_finalizacion) {
                            const finalDate = new Date(task.fecha_tentativa_finalizacion);
                            finalDateStr = finalDate.toLocaleString();
                            const diff = finalDate - new Date();
                            if (diff > 0) {
                                // Convertir diferencia en horas y minutos
                                const hours = Math.floor(diff / 3600000);
                                const minutes = Math.floor((diff % 3600000) / 60000);
                                timeRemainingStr = `${hours} hrs ${minutes} mins`;
                            } else {
                                timeRemainingStr = "Vencida";
                            }
                        }

                        // Usar el nombre de la categoría (si existe)
                        const categoryName = task.id_categoria && categoriesMap[task.id_categoria] 
                            ? categoriesMap[task.id_categoria] 
                            : "Sin Categoría";

                        tr.innerHTML = `
                            <td>${finalDateStr}</td>
                            <td>${timeRemainingStr}</td>
                            <td>${task.texto_tarea}</td>
                            <td>${categoryName}</td>
                            <td>${task.estado}</td>
                            <td>${task.fecha_creacion ? new Date(task.fecha_creacion).toLocaleString() : "N/A"}</td>
                            <td>
                                <button class="btn btn-sm btn-primary edit-task" 
                                  data-id="${task.id}" 
                                  data-text="${task.texto_tarea}"
                                  data-category="${task.id_categoria || ""}"
                                  data-state="${task.estado}"
                                  data-finaldate="${task.fecha_tentativa_finalizacion || ""}"
                                >Editar</button>
                                <button class="btn btn-sm btn-danger delete-task" data-id="${task.id}">Eliminar</button>
                            </td>
                        `;
                        tasksTable.appendChild(tr);
                    });
                }
            }
        } catch (error) {
        }
    };

    // Función para crear una tarea
    const createTask = async (texto_tarea, id_categoria, estado, fecha_tentativa_finalizacion) => {
        try {
            const payload = { texto_tarea, estado };
            if (id_categoria) payload.id_categoria = id_categoria;
            if (fecha_tentativa_finalizacion) payload.fecha_tentativa_finalizacion = fecha_tentativa_finalizacion;
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                alert("Tarea creada exitosamente.");
                const createTaskModal = bootstrap.Modal.getInstance(document.getElementById("createTaskModal"));
                createTaskModal.hide();
                loadTasks();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.detail}`);
            }
        } catch (error) { }
    };

    document.getElementById("show-create-task")?.addEventListener("click", () => {
        const createTaskModal = new bootstrap.Modal(document.getElementById("createTaskModal"));
        createTaskModal.show();
    });

    document.getElementById("create-task-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const texto_tarea = document.getElementById("task-text").value.trim();
        const id_categoria = document.getElementById("task-category").value;
        const estado = document.getElementById("task-state").value;
        const dateOption = document.getElementById("task-date-option").value;
        let fecha_tentativa_finalizacion = null;
        if (dateOption !== "no-date") {
            if (dateOption === "tomorrow") {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                fecha_tentativa_finalizacion = tomorrow.toISOString();
            } else if (dateOption === "later-week") {
                const laterWeek = new Date();
                laterWeek.setDate(laterWeek.getDate() + 7);
                fecha_tentativa_finalizacion = laterWeek.toISOString();
            } else if (dateOption === "weekend") {
                const today = new Date();
                const dayOfWeek = today.getDay();
                const daysUntilWeekend = dayOfWeek <= 6 ? 6 - dayOfWeek : 0;
                const weekend = new Date();
                weekend.setDate(today.getDate() + daysUntilWeekend);
                fecha_tentativa_finalizacion = weekend.toISOString();
            } else if (dateOption === "custom") {
                const customDate = document.getElementById("task-custom-date").value;
                if (customDate) {
                    const selectedDate = new Date(customDate);
                    if (selectedDate < new Date()) {
                        alert("La fecha seleccionada no puede ser anterior a hoy.");
                        return;
                    }
                    fecha_tentativa_finalizacion = selectedDate.toISOString();
                }
            }
        }
        if (!texto_tarea || !estado) {
            alert("Por favor, completa todos los campos obligatorios.");
            return;
        }
        createTask(texto_tarea, id_categoria, estado, fecha_tentativa_finalizacion);
    });

    // Función para actualizar una tarea (incluye fecha de fin si se proporciona)
    const updateTask = async (id, texto_tarea, id_categoria, estado, fecha_tentativa_finalizacion) => {
        try {
            const payload = { texto_tarea, estado };
            if (id_categoria) payload.id_categoria = id_categoria;
            if (fecha_tentativa_finalizacion) payload.fecha_tentativa_finalizacion = fecha_tentativa_finalizacion;
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                alert("Tarea actualizada exitosamente.");
                const editTaskModal = bootstrap.Modal.getInstance(document.getElementById("editTaskModal"));
                editTaskModal.hide();
                loadTasks();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.detail}`);
            }
        } catch (error) { }
    };

    document.getElementById("edit-task-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-task-id").value;
        const texto_tarea = document.getElementById("edit-task-text").value.trim();
        const id_categoria = document.getElementById("edit-task-category").value;
        const estado = document.getElementById("edit-task-state").value;
        const finalDateInput = document.getElementById("edit-task-final-date").value;
        let fecha_tentativa_finalizacion = finalDateInput ? new Date(finalDateInput).toISOString() : null;
        if (!texto_tarea || !estado) {
            alert("Por favor, completa todos los campos obligatorios.");
            return;
        }
        updateTask(id, texto_tarea, id_categoria, estado, fecha_tentativa_finalizacion);
    });

    // Función para cargar categorías (tabla de categorías sin modificación adicional a nivel de datos)
    const loadCategories = async () => {
        const categoriesTable = document.getElementById("categories-table");
        if (!categoriesTable) {
            console.error("Elemento 'categories-table' no encontrado.");
            alert("Ocurrió un error al cargar las categorías.");
            return;
        }
        categoriesTable.innerHTML = "";
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/categorias/`, { method: "GET" });
            if (response.ok) {
                const categories = await response.json();
                if (categories.length === 0) {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `<td colspan="3" class="text-center">No hay categorías disponibles.</td>`;
                    categoriesTable.appendChild(tr);
                } else {
                    categories.forEach((cat) => {
                        // En la tabla de categorías mostramos el nombre (no el id)
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td>${cat.nombre}</td>
                            <td>${cat.descripcion || ""}</td>
                            <td>
                                <button class="btn btn-sm btn-primary edit-category" data-id="${cat.id}" data-nombre="${cat.nombre}" data-descripcion="${cat.descripcion}">Editar</button>
                                <button class="btn btn-sm btn-danger delete-category" data-id="${cat.id}">Eliminar</button>
                            </td>
                        `;
                        categoriesTable.appendChild(tr);
                    });
                }
            }
        } catch (error) { }
    };

    // Función para crear una categoría
    const createCategory = async (nombre, descripcion) => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/categorias/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, descripcion }),
            });
            if (response.ok) {
                alert("Categoría creada exitosamente.");
                const createCategoryModal = bootstrap.Modal.getInstance(document.getElementById("createCategoryModal"));
                createCategoryModal.hide();
                loadCategories();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.detail}`);
            }
        } catch (error) { }
    };

    document.getElementById("show-create-category")?.addEventListener("click", () => {
        const createCategoryModal = new bootstrap.Modal(document.getElementById("createCategoryModal"));
        createCategoryModal.show();
    });

    document.getElementById("create-category-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const nombre = document.getElementById("category-name").value.trim();
        const descripcion = document.getElementById("category-description").value.trim();
        if (!nombre) {
            alert("Por favor, ingresa el nombre de la categoría.");
            return;
        }
        createCategory(nombre, descripcion);
    });

    // Función para actualizar una categoría
    const updateCategory = async (id, nombre, descripcion) => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/categorias/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, descripcion }),
            });
            if (response.ok) {
                alert("Categoría actualizada exitosamente.");
                const editCategoryModal = bootstrap.Modal.getInstance(document.getElementById("editCategoryModal"));
                editCategoryModal.hide();
                loadCategories();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.detail}`);
            }
        } catch (error) { }
    };

    document.getElementById("edit-category-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-category-id").value;
        const nombre = document.getElementById("edit-category-name").value.trim();
        const descripcion = document.getElementById("edit-category-description").value.trim();
        if (!nombre) {
            alert("Por favor, ingresa el nombre de la categoría.");
            return;
        }
        updateCategory(id, nombre, descripcion);
    });

    // Delegación de eventos para tareas
    document.getElementById("tasks-table").addEventListener("click", (e) => {
        if (e.target && e.target.matches("button.edit-task")) {
            const id = e.target.getAttribute("data-id");
            const text = e.target.getAttribute("data-text");
            const category = e.target.getAttribute("data-category");
            const state = e.target.getAttribute("data-state");
            const finalDate = e.target.getAttribute("data-finaldate");

            document.getElementById("edit-task-id").value = id;
            document.getElementById("edit-task-text").value = text;
            document.getElementById("edit-task-category").value = category;
            document.getElementById("edit-task-state").value = state;
            // Pre-cargar la fecha en formato "YYYY-MM-DDTHH:MM" si existe
            if (finalDate) {
                const dt = new Date(finalDate);
                const isoStr = dt.toISOString().slice(0,16);
                document.getElementById("edit-task-final-date").value = isoStr;
            } else {
                document.getElementById("edit-task-final-date").value = "";
            }
            const editTaskModal = new bootstrap.Modal(document.getElementById("editTaskModal"));
            editTaskModal.show();
        }

        if (e.target && e.target.matches("button.delete-task")) {
            const id = e.target.getAttribute("data-id");
            if (confirm("¿Estás seguro de eliminar esta tarea?")) {
                deleteTask(id);
            }
        }
    });

    // Delegación de eventos para categorías
    document.getElementById("categories-table").addEventListener("click", (e) => {
        if (e.target && e.target.matches("button.edit-category")) {
            const id = e.target.getAttribute("data-id");
            const nombre = e.target.getAttribute("data-nombre");
            const descripcion = e.target.getAttribute("data-descripcion");
            document.getElementById("edit-category-id").value = id;
            document.getElementById("edit-category-name").value = nombre;
            document.getElementById("edit-category-description").value = descripcion || "";
            const editCategoryModal = new bootstrap.Modal(document.getElementById("editCategoryModal"));
            editCategoryModal.show();
        }

        if (e.target && e.target.matches("button.delete-category")) {
            const id = e.target.getAttribute("data-id");
            if (confirm("¿Estás seguro de eliminar esta categoría?")) {
                deleteCategory(id);
            }
        }
    });

    // Función para eliminar una tarea
    const deleteTask = async (id) => {
        try {
            const deleteResponse = await fetchWithAuth(`${API_BASE_URL}/tasks/${id}`, { method: "DELETE" });
            if (deleteResponse.ok) {
                alert("Tarea eliminada.");
                loadTasks();
            } else {
                const errorData = await deleteResponse.json();
                alert(`Error: ${errorData.detail}`);
            }
        } catch (error) { }
    };

    // Función para eliminar una categoría
    const deleteCategory = async (id) => {
        try {
            const deleteResponse = await fetchWithAuth(`${API_BASE_URL}/categorias/${id}`, { method: "DELETE" });
            if (deleteResponse.ok) {
                alert("Categoría eliminada.");
                loadCategories();
            } else {
                const errorData = await deleteResponse.json();
                alert(`Error: ${errorData.detail}`);
            }
        } catch (error) { }
    };

    // Función para cargar el perfil
    const loadProfile = async () => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/users/me/`, { method: "GET" });
            if (response.ok) {
                const user = await response.json();
                document.getElementById("profile-username").textContent = user.nombre_usuario;
                const profileImage = document.getElementById("profile-image");
                let imagenPerfil = user.imagen_perfil || "/static/images/default_profile.png";
                if (!imagenPerfil.startsWith("/")) {
                    imagenPerfil = `/${imagenPerfil}`;
                }
                profileImage.src = `${API_BASE_URL}${imagenPerfil}`;
                profileImage.onerror = () => {
                    profileImage.src = "https://via.placeholder.com/150";
                };

                const uploadForm = document.getElementById("upload-profile-form");
                if (uploadForm && !uploadForm.dataset.listenerAdded) {
                    uploadForm.addEventListener("submit", async (e) => {
                        e.preventDefault();
                        const fileInput = document.getElementById("profile-image-upload");
                        const file = fileInput.files[0];
                        if (!file) {
                            alert("Selecciona una imagen primero.");
                            return;
                        }
                        const formData = new FormData();
                        formData.append("file", file);
                        try {
                            const uploadResponse = await fetchWithAuth(
                                `${API_BASE_URL}/users/${user.id}/upload-profile-image/`,
                                { method: "POST", body: formData }
                            );
                            if (uploadResponse.ok) {
                                alert("Imagen de perfil actualizada.");
                                loadProfile();
                            } else {
                                const errorData = await uploadResponse.json();
                                alert(`Error: ${errorData.detail}`);
                            }
                        } catch (error) { }
                    });
                    uploadForm.dataset.listenerAdded = "true";
                }
            }
        } catch (error) { }
    };

    // Inicializar navegación y mostrar sección inicial
    updateNav();
    if (token) {
        showSection("tasks");
    } else {
        showSection("home");
    }
});
