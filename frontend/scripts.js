document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://localhost:8000"; // Mantener el puerto 8000

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
                // Si el usuario está autenticado, redirigir a tareas
                sections["tasks"].classList.remove("d-none");
                loadTasks();
            } else {
                // Si no está autenticado, mostrar la sección home
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
            // Navegación para usuarios autenticados
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
            // Navegación para usuarios no autenticados
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

        // Añadir eventos a los enlaces de navegación
        document.querySelectorAll("[data-section]").forEach((link) => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const section = e.target.getAttribute("data-section");
                showSection(section);
            });
        });
        

        // Evento de cierre de sesión
        const logoutLink = document.getElementById("logout-link");
        if (logoutLink) {
            logoutLink.addEventListener("click", (e) => {
                e.preventDefault();
                logout();
            });
        }
    };

    // Función para manejar cambios en la opción de fecha
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

    // Añadir evento listener al selector de fecha
    document
        .getElementById("task-date-option")
        ?.addEventListener("change", handleDateOptionChange);

    // Función para registrar un usuario
    const register = async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
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

    // Manejar Registro
    document.getElementById("register-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const nombre_usuario = document.getElementById("reg-username").value.trim();
        const contrasenia = document.getElementById("reg-password").value.trim();

        // Validar que los campos no estén vacíos
        if (!nombre_usuario || !contrasenia) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        const data = { nombre_usuario, contrasenia };
        register(data);
    });

    // Función para iniciar sesión
    const login = async (username, password) => {
        try {
            const formData = new URLSearchParams();
            formData.append("username", username);
            formData.append("password", password);

            const response = await fetch(`${API_BASE_URL}/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                token = data.access_token;
                localStorage.setItem("token", token);
                alert("Inicio de sesión exitoso.");
                updateNav();
                showSection("tasks"); // Redirigir a tareas
                loadTasks();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.detail}`);
            }
        } catch (error) {
            console.error("Error iniciando sesión:", error);
            alert("Ocurrió un error al iniciar sesión.");
        }
    };

    // Función para cerrar sesión
    const logout = () => {
        localStorage.removeItem("token");
        token = null;
        alert("Has cerrado sesión.");
        updateNav();
        showSection("home");
    };

    // Función para cargar tareas
    const loadTasks = async () => {
        const tasksTable = document.getElementById("tasks-table");
        if (!tasksTable) {
            console.error("Elemento 'tasks-table' no encontrado.");
            alert("Ocurrió un error al cargar las tareas.");
            return;
        }
        tasksTable.innerHTML = "";

        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/`, {
                method: "GET",
            });

            if (response.ok) {
                const tasks = await response.json();
                if (tasks.length === 0) {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td colspan="7" class="text-center">No tienes tareas asignadas.</td>
                    `;
                    tasksTable.appendChild(tr);
                } else {
                    tasks.forEach((task) => {
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td>${task.id}</td>
                            <td>${task.texto_tarea}</td>
                            <td>${task.id_categoria !== null ? task.id_categoria : "Sin Categoría"}</td>
                            <td>${task.estado}</td>
                            <td>${task.fecha_creacion ? new Date(task.fecha_creacion).toLocaleString() : "N/A"}</td>
                            <td>${task.fecha_tentativa_finalizacion ? new Date(task.fecha_tentativa_finalizacion).toLocaleString() : "N/A"}</td>
                            <td>
                                <button class="btn btn-sm btn-primary edit-task" data-id="${task.id}" data-text="${task.texto_tarea}" data-category="${task.id_categoria}" data-state="${task.estado}">Editar</button>
                                <button class="btn btn-sm btn-danger delete-task" data-id="${task.id}">Eliminar</button>
                            </td>
                        `;
                        tasksTable.appendChild(tr);
                    });
                }

                // Cargar categorías en el formulario de crear tarea
                const categorySelect = document.getElementById("task-category");
                if (categorySelect) {
                    categorySelect.innerHTML = '<option value="">--Sin Categoría--</option>';
                    const categoriesResponse = await fetchWithAuth(`${API_BASE_URL}/categorias/`, {
                        method: "GET",
                    });

                    if (categoriesResponse.ok) {
                        const categories = await categoriesResponse.json();
                        categories.forEach((cat) => {
                            const option = document.createElement("option");
                            option.value = cat.id;
                            option.textContent = cat.nombre;
                            categorySelect.appendChild(option);
                        });
                    } else {
                        const errorData = await categoriesResponse.json();
                        alert(`Error al cargar categorías: ${errorData.detail}`);
                    }
                } else {
                    console.error("Elemento 'task-category' no encontrado.");
                }
            }
        } catch (error) {
            // El manejo de 401 ya se realiza en fetchWithAuth
        }
    };

    // Función para crear una tarea
    const createTask = async (texto_tarea, id_categoria, estado, fecha_tentativa_finalizacion) => {
        try {
            const payload = { texto_tarea, estado };
            if (id_categoria) {
                payload.id_categoria = id_categoria;
            }
            if (fecha_tentativa_finalizacion) {
                payload.fecha_tentativa_finalizacion = fecha_tentativa_finalizacion;
            }
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert("Tarea creada exitosamente.");
                const createTaskModal = bootstrap.Modal.getInstance(
                    document.getElementById("createTaskModal")
                );
                createTaskModal.hide();
                loadTasks();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.detail}`);
            }
        } catch (error) {
            // El manejo de 401 ya se realiza en fetchWithAuth
        }
    };

    // Función para actualizar una tarea
    const updateTask = async (id, texto_tarea, id_categoria, estado) => {
        try {
            const payload = { texto_tarea, estado };
            if (id_categoria) {
                payload.id_categoria = id_categoria;
            }
            const response = await fetchWithAuth(`${API_BASE_URL}/tasks/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert("Tarea actualizada exitosamente.");
                const editTaskModal = bootstrap.Modal.getInstance(
                    document.getElementById("editTaskModal")
                );
                editTaskModal.hide();
                loadTasks();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.detail}`);
            }
        } catch (error) {
            // El manejo de 401 ya se realiza en fetchWithAuth
        }
    };

    // Función para cargar categorías
    const loadCategories = async () => {
        const categoriesTable = document.getElementById("categories-table");
        if (!categoriesTable) {
            console.error("Elemento 'categories-table' no encontrado.");
            alert("Ocurrió un error al cargar las categorías.");
            return;
        }
        categoriesTable.innerHTML = "";

        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/categorias/`, {
                method: "GET",
            });

            if (response.ok) {
                const categories = await response.json();
                if (categories.length === 0) {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td colspan="4" class="text-center">No hay categorías disponibles.</td>
                    `;
                    categoriesTable.appendChild(tr);
                } else {
                    categories.forEach((cat) => {
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td>${cat.id}</td>
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

                // Delegación de Eventos para Editar y Eliminar Categorías
                // Elimina event listeners duplicados al usar delegación
            }
        } catch (error) {
            // El manejo de 401 ya se realiza en fetchWithAuth
        }
    };

    // Función para crear una categoría
    const createCategory = async (nombre, descripcion) => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/categorias/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ nombre, descripcion }),
            });

            if (response.ok) {
                alert("Categoría creada exitosamente.");
                const createCategoryModal = bootstrap.Modal.getInstance(
                    document.getElementById("createCategoryModal")
                );
                createCategoryModal.hide();
                loadCategories();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.detail}`);
            }
        } catch (error) {
            // El manejo de 401 ya se realiza en fetchWithAuth
        }
    };

    // Función para actualizar una categoría
    const updateCategory = async (id, nombre, descripcion) => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/categorias/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ nombre, descripcion }),
            });

            if (response.ok) {
                alert("Categoría actualizada exitosamente.");
                const editCategoryModal = bootstrap.Modal.getInstance(
                    document.getElementById("editCategoryModal")
                );
                editCategoryModal.hide();
                loadCategories();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.detail}`);
            }
        } catch (error) {
            // El manejo de 401 ya se realiza en fetchWithAuth
        }
    };

    // Función para cargar perfil
    const loadProfile = async () => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/users/me/`, {
                method: "GET",
            });

            if (response.ok) {
                const user = await response.json();
                document.getElementById("profile-username").textContent = user.nombre_usuario;
                const profileImage = document.getElementById("profile-image");

                // Asegurar que la ruta comience con '/'
                let imagenPerfil = user.imagen_perfil || "/static/images/default_profile.png";
                if (!imagenPerfil.startsWith("/")) {
                    imagenPerfil = `/${imagenPerfil}`;
                }

                profileImage.src = `${API_BASE_URL}${imagenPerfil}`;
                profileImage.onerror = () => {
                    profileImage.src = "https://via.placeholder.com/150";
                };

                // Manejar subida de imagen de perfil
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
                                {
                                    method: "POST",
                                    body: formData,
                                }
                            );

                            if (uploadResponse.ok) {
                                alert("Imagen de perfil actualizada.");
                                loadProfile();
                            } else {
                                const errorData = await uploadResponse.json();
                                alert(`Error: ${errorData.detail}`);
                            }
                        } catch (error) {
                            // El manejo de 401 ya se realiza en fetchWithAuth
                        }
                    });
                    uploadForm.dataset.listenerAdded = "true";
                }
            }
        } catch (error) {
            // El manejo de 401 ya se realiza en fetchWithAuth
        }
    };

    // Función para eliminar una tarea
    const deleteTask = async (id) => {
        try {
            const deleteResponse = await fetchWithAuth(`${API_BASE_URL}/tasks/${id}`, {
                method: "DELETE",
            });

            if (deleteResponse.ok) {
                alert("Tarea eliminada.");
                loadTasks();
            } else {
                const errorData = await deleteResponse.json();
                alert(`Error: ${errorData.detail}`);
            }
        } catch (error) {
            // El manejo de 401 ya se realiza en fetchWithAuth
        }
    };

    // Función para eliminar una categoría
    const deleteCategory = async (id) => {
        try {
            const deleteResponse = await fetchWithAuth(`${API_BASE_URL}/categorias/${id}`, {
                method: "DELETE",
            });

            if (deleteResponse.ok) {
                alert("Categoría eliminada.");
                loadCategories();
            } else {
                const errorData = await deleteResponse.json();
                alert(`Error: ${errorData.detail}`);
            }
        } catch (error) {
            // El manejo de 401 ya se realiza en fetchWithAuth
        }
    };

    // Inicializar navegación y mostrar sección inicial
    updateNav();

    // Determinar qué sección mostrar al iniciar
    if (token) {
        showSection("tasks");
    } else {
        // Mostrar la sección de inicio por defecto si no está autenticado
        showSection("home");
    }

    // Manejar Inicio de Sesión
    document.getElementById("login-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = document.getElementById("login-username").value.trim();
        const password = document.getElementById("login-password").value.trim();

        // Validar que los campos no estén vacíos
        if (!username || !password) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        login(username, password);
    });

    // Manejar Creación de Tarea
    document.getElementById("show-create-task")?.addEventListener("click", () => {
        const createTaskModal = new bootstrap.Modal(
            document.getElementById("createTaskModal")
        );
        createTaskModal.show();
    });

    document
        .getElementById("create-task-form")
        ?.addEventListener("submit", (e) => {
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
                    const dayOfWeek = today.getDay(); // 0 (Domingo) - 6 (Sábado)
                    const daysUntilWeekend = dayOfWeek <= 6 ? 6 - dayOfWeek : 0;
                    const weekend = new Date();
                    weekend.setDate(today.getDate() + daysUntilWeekend);
                    fecha_tentativa_finalizacion = weekend.toISOString();
                } else if (dateOption === "custom") {
                    const customDate = document.getElementById("task-custom-date").value;
                    if (customDate) {
                        const selectedDate = new Date(customDate);
                        const now = new Date();
                        if (selectedDate < now) {
                            alert("La fecha seleccionada no puede ser anterior a hoy.");
                            return;
                        }
                        fecha_tentativa_finalizacion = selectedDate.toISOString();
                    }
                }
            }

            // Validar que los campos obligatorios no estén vacíos
            if (!texto_tarea || !estado) {
                // Hacer id_categoria opcional
                alert("Por favor, completa todos los campos obligatorios.");
                return;
            }

            createTask(
                texto_tarea,
                id_categoria,
                estado,
                fecha_tentativa_finalizacion
            );
        });

    // Manejar Actualización de Tarea
    document.getElementById("edit-task-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-task-id").value;
        const texto_tarea = document.getElementById("edit-task-text").value.trim();
        const id_categoria = document.getElementById("edit-task-category").value;
        const estado = document.getElementById("edit-task-state").value;
        if (!texto_tarea || !estado) {
            // Hacer id_categoria opcional
            alert("Por favor, completa todos los campos obligatorios.");
            return;
        }
        updateTask(id, texto_tarea, id_categoria, estado);
    });

    // Manejar Creación de Categoría
    document
        .getElementById("show-create-category")
        ?.addEventListener("click", () => {
            const createCategoryModal = new bootstrap.Modal(
                document.getElementById("createCategoryModal")
            );
            createCategoryModal.show();
        });

    document
        .getElementById("create-category-form")
        ?.addEventListener("submit", (e) => {
            e.preventDefault();
            const nombre = document.getElementById("category-name").value.trim();
            const descripcion = document
                .getElementById("category-description")
                .value.trim();
            if (!nombre) {
                alert("Por favor, ingresa el nombre de la categoría.");
                return;
            }
            createCategory(nombre, descripcion);
        });

    // Manejar Actualización de Categoría
    document
        .getElementById("edit-category-form")
        ?.addEventListener("submit", (e) => {
            e.preventDefault();
            const id = document.getElementById("edit-category-id").value;
            const nombre = document.getElementById("edit-category-name").value.trim();
            const descripcion = document
                .getElementById("edit-category-description")
                .value.trim();
            if (!nombre) {
                alert("Por favor, ingresa el nombre de la categoría.");
                return;
            }
            updateCategory(id, nombre, descripcion);
        });

    // Delegación de Eventos para Editar y Eliminar Tareas
    document.getElementById("tasks-table").addEventListener("click", (e) => {
        if (e.target && e.target.matches("button.edit-task")) {
            const id = e.target.getAttribute("data-id");
            const text = e.target.getAttribute("data-text");
            const category = e.target.getAttribute("data-category");
            const state = e.target.getAttribute("data-state");

            document.getElementById("edit-task-id").value = id;
            document.getElementById("edit-task-text").value = text;
            document.getElementById("edit-task-category").value = category;
            document.getElementById("edit-task-state").value = state;

            const editTaskModal = new bootstrap.Modal(
                document.getElementById("editTaskModal")
            );
            editTaskModal.show();
        }

        if (e.target && e.target.matches("button.delete-task")) {
            const id = e.target.getAttribute("data-id");
            if (confirm("¿Estás seguro de eliminar esta tarea?")) {
                deleteTask(id);
            }
        }
    });

    // Delegación de Eventos para Editar y Eliminar Categorías
    document.getElementById("categories-table").addEventListener("click", (e) => {
        if (e.target && e.target.matches("button.edit-category")) {
            const id = e.target.getAttribute("data-id");
            const nombre = e.target.getAttribute("data-nombre");
            const descripcion = e.target.getAttribute("data-descripcion");

            document.getElementById("edit-category-id").value = id;
            document.getElementById("edit-category-name").value = nombre;
            document.getElementById("edit-category-description").value = descripcion || "";

            const editCategoryModal = new bootstrap.Modal(
                document.getElementById("editCategoryModal")
            );
            editCategoryModal.show();
        }

        if (e.target && e.target.matches("button.delete-category")) {
            const id = e.target.getAttribute("data-id");
            if (confirm("¿Estás seguro de eliminar esta categoría?")) {
                deleteCategory(id);
            }
        }
    });
});
