function iniciarApp() { //Se dispara cuando se ejecute por completo DOMCONTENTLOADED
    
    const resultado = document.querySelector("#resultado");
    const selectCategorias = document.querySelector("#categorias");

    if(selectCategorias){ //Si el elemento existe, lo agregamos
        selectCategorias.addEventListener("change", seleccionarCategoria);
        obtenerCategorias();
    }
    
    const favoritosDiv = document.querySelector(".favoritos");
    if(favoritosDiv){
        obtenerFavoritos();
    }


    const modal = new bootstrap.Modal("#modal", {}); //Hacemos la instancia, a donde lo queremos aplicar, en este caso en el HTML con id de modal y como segunda opción las opciones para crear el modal.

    

    function obtenerCategorias() {
        const url = "https://www.themealdb.com/api/json/v1/1/categories.php";

        fetch(url)
            .then(result => result.json())
            .then(result => mostrarCategorias(result.categories)) //Le ponemos result.categories porque así sale el array de las categorias como tal 
    }

    function mostrarCategorias(categorias = []) {
        categorias.forEach(categoria => {

            // const { strCategory } = categoria; tambien podemos hacer destructuring
            //Todo lo que sea un obj podemos hacer destructuring

            // console.log(categoria);
            const option = document.createElement("OPTION");
            option.value = categoria.strCategory; //revisamos lo que tenga la api en el obj
            option.textContent = categoria.strCategory;
            // console.log(option); //Por cada iteración de categoría va a mostrar un option
            selectCategorias.appendChild(option);
        })
    }
    
    function seleccionarCategoria(e) { //Le pasamos el evento para recuperar la selección del usuario   
        const categoria = e.target.value;
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;
        console.log(url);
        fetch(url)
            .then((result) => {
                return result.json(); //Recordar el return en las funciones, porque de otra forma no regresa nada
            }).then((response) => {
                mostrarRecetas(response.meals); //Para acceder directamente
            });

    }

    function mostrarRecetas(recetas = []/* Para que sea un array por defecto */) {

        limpiarHTML(resultado); //Solo limpiará el HTML del contenedor resultado

        const heading = document.createElement("h2");
        heading.classList.add("text-center", "text-black", "my-5");
        heading.textContent = recetas.length ? "Resultados": "No hay resultados";
        //Si hay resultados, el textContent será si existe un length de recetas, dado lo contrario, se mostrará no hay resultados. 
        resultado.appendChild(heading);

        //Iterar en los resultados
        recetas.forEach(receta => {

            const {idMeal, strMeal, strMealThumb}  = receta;

            const recetaContenedor = document.createElement("div");
            recetaContenedor.classList.add("col-md-4");
            
            const recetaCard = document.createElement("div");
            recetaCard.classList.add("card", "mb-4");

            const recetaImg = document.createElement("img");
            recetaImg.classList.add("card-img-top");
            recetaImg.alt = `Imagen de la receta ${strMeal ?? receta.title}`; //Le agrega lo que tenemos en localStorage
            recetaImg.src = strMealThumb ?? receta.img; //Le agrega lo que tenemos en localStorage

            const recetaCardBody = document.createElement("div");
            recetaCardBody.classList.add("card-body");

            const recetaHeading = document.createElement("h3");
            recetaHeading.classList.add("card-title", "mb-3");
            recetaHeading.textContent = strMeal ?? receta.title; //Le agrega lo que tenemos en localStorage


            const recetaBtn = document.createElement("button");
            recetaBtn.classList.add("btn", "btn-danger", "w-100");
            recetaBtn.textContent = "Ver Receta";
            // recetaBtn.dataset.bsTarget = "#modal"; //Le añade una propiedad como un id al btn que creamos
            // recetaBtn.dataset.bsToggle = "modal"; //Le añade una propiedad como un id al btn que creamos
            recetaBtn.onclick = function() {
                seleccionarReceta(idMeal ?? receta.id);
            }/*Usamos onclick porque este elemento no existe en el HTML, solo usaremos esto si se genera en JS */

            //Renderizar en el HTML
            recetaCardBody.appendChild(recetaHeading);
            recetaCardBody.appendChild(recetaBtn);

            recetaCard.appendChild(recetaImg);
            recetaCard.appendChild(recetaCardBody);

            recetaContenedor.appendChild(recetaCard); 
            //Para que se muestre necesitamos un contenedor ya hecho en HTML
            //El elemento resultado es un contenedor id vacío
            resultado.appendChild(recetaContenedor);

        })

    }

    function seleccionarReceta(id) {
        const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
        fetch(url)
            .then((result) => {
                return result.json();
            }).then((result) => {
                mostrarRecetaModal(result.meals[0]); //Posición 0 para que nos aparezca como un objeto
            });
    }

    function mostrarRecetaModal(receta) {
        console.log(receta);
        const {idMeal, strInstructions, strMeal, strMealThumb} = receta;

        //Añadir contenido al modal
        const modalTitle = document.querySelector(".modal .modal-title");
        const modalBody = document.querySelector(".modal .modal-body");
        modalTitle.textContent = strMeal;
        modalBody.innerHTML = `
            <img  class="img-fluid" src="${strMealThumb}" alt="Receta: ${strMeal}"/>
            <h3 clas="my-3">Instrucciones</h3>
            <p>${strInstructions}</p>
            <h3 clas="my-3">Cantidades e Ingredientes</h3>

        `;

        const listGroup = document.createElement("ul");
        listGroup.classList.add("list-group");

        //Mostrar cantidades e ingredientes
        for (let i = 1; i <= 20; i++) { //Iteramos a través de todos los ingredientes y medidas que tengamos
            if(receta[`strIngredient${i}`]){
                const ingrediente = receta[`strIngredient${i}`]; //Los obtenemos todos
                const cantidad = receta[`strMeasure${i}`];

                const ingredienteLi = document.createElement("li");
                ingredienteLi.classList.add("list-group-item");
                ingredienteLi.textContent = `${ingrediente} - ${cantidad}`;
                listGroup.appendChild(ingredienteLi);
            }
            
        }

        modalBody.appendChild(listGroup);


        const modalFooter = document.querySelector(".modal-footer");

        limpiarHTML(modalFooter); //Limpiamos los botones generados

        //Botones de cerrar y favoritos
        const btnFavorito = document.createElement("button");
        btnFavorito.classList.add("btn", "btn-danger", "col");
        btnFavorito.textContent = existeStorage(idMeal) ? "Eliminar favorito" : "Guardar favorito";

        //Almacenar en localStorage
        btnFavorito.onclick = function() {

            if(existeStorage(idMeal)){ //Si sale como true, entonces no lo agrega de nuevo al localStorage
                (eliminarFavorito(idMeal))
                btnFavorito.textContent = "Guardar favorito";
                mostrarToast("Eliminado correctamente");
                return;
            }
            

            agregarFavorito({
                id: idMeal,
                title: strMeal,
                img: strMealThumb

            });
            btnFavorito.textContent = "Eliminar favorito";
            mostrarToast("Agregado correctamente");
        } 

        const btnCerrar = document.createElement("button");
        btnCerrar.classList.add("btn", "btn-secondary", "col", "btn");
        btnCerrar.onclick = function() {
            modal.hide();
        }
        btnCerrar.textContent = "Cerrar";

        modalFooter.appendChild(btnFavorito);
        modalFooter.appendChild(btnCerrar); //Hay que limpiar el footer para que no aparezcan mas botones de sobra en otras recetas

        modal.show(); //Muestra el modal
    }

    function agregarFavorito(receta) {
        const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
        localStorage.setItem("favoritos", JSON.stringify([...favoritos, receta]));
        console.log(favoritos)
    }

    function eliminarFavorito(id) {
        const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
        const nuevosFavoritos = favoritos.filter(favorito => favorito.id != id);
        localStorage.setItem("favoritos", JSON.stringify(nuevosFavoritos));
    }

    function mostrarToast(mensaje) {
        const toastDiv = document.querySelector("#toast");
        const toastBody = document.querySelector(".toast-body");

        //Creamos una instancia con un nuevo toast
        const toast = new bootstrap.Toast(toastDiv);
        toastBody.textContent = mensaje;
        toast.show();

    }

    function existeStorage(id) {
        const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
        return favoritos.some(favorito => favorito.id === id); //Itera sobre cada uno de los elementos y regresa si alguno cumple con la condición
    }

    function obtenerFavoritos() {
        const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
        if(favoritos.length){ //Para verificar si hay algo en los favoritos
            mostrarRecetas(favoritos); //Hará un array de recetas
            return; //Podemos poner un return para quitar el else, y así si queremos poner otro condicional ponemos otro if
        } 

        const noFavoritos = document.createElement("P");
        noFavoritos.textContent = "No hay favoritos aún...";
        noFavoritos.classList.add("fs-4", "text-center", "font-bold", "mt-5");
        resultado.appendChild(noFavoritos);
        
    }

    function limpiarHTML(selector) { //Solamente limpiará el contenedor del selector que le proporcionemos
        while(selector.firstChild){
            selector.removeChild(selector.firstChild);
        }
    }
}   



document.addEventListener("DOMContentLoaded", iniciarApp);

// En resumen, este código básicamente realiza una solicitud a una API cuando la página se carga, recupera las categorías, y luego realiza alguna acción (en este caso, imprimir en la consola). Puedes personalizarlo según las necesidades específicas de tu aplicación.

