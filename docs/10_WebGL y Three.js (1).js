











WEBGL Y THREE.JS

Alicia V�zquez @aliciaFPInf

�Qu� es WebGL?

WebGL es una tecnolog�a que permite dibujar gr�?cos 3D en el navegador usando la tarjeta gr�?ca (GPU) del ordenador, sin plugins.
WebGL convierte el navegador en un mini-motor gr�?co.
? Dibuja tri�ngulos (TODO en 3D son tri�ngulos)
? Usa la GPU
? Funciona dentro de un <canvas>
? Utiliza shaders (programas gr�?cos)

Pero WebGL "puro" es muy complejo y di?cil de programar y gestionar ? Three.js que es una librer�a de JS que usa WebGL de manera transparente al usuario.

�Qu� es Three.js?

Three.js es una librer�a JavaScript que usa WebGL internamente, pero nos permite trabajar con conceptos de alto nivel:


WebGL puro
Three.js
Bu?ers
Geometr�as
Shaders
Materiales
Matrices
Camaras
Draw calls
Scene + Mesh

�Por qu� Three.js es ideal para vosotros?

Porque permite:
? importar modelos desde Blender
? usar materiales PBR
? crear luces y sombras
? mover la c�mara con el rat�n
? interactuar con objetos (click, hover)
? crear portfolios, videojuegos, experiencias

Three.js es el puente perfecto entre Blender y la web

�C�mo se muestra 3D en una web?


Elementos b�sicos

1. HTML ? estructura
2. CSS ? dise�o
3. JavaScript ? l�gica
4. Canvas ? superficie de dibujo
5. WebGL / Three.js ? render 3D











01
Proyecto Three.js

Dibujando un objeto


1. Creamos los archivos
2. Elementos JS
3. Escena
a. Creamos la escena en la que vamos a dibujar.
b. Le podemos modificar el color de fondo.

4. C�mara (PerspectiveCamera)


Three.js tiene varios tipos de c�maras. Usamos PerspectiveCamera porque imita c�mo ve el ojo humano.

Par�metros:

1. FOV (Field of View)
�ngulo de visi�n en grados. Define cu�nto de la escena se ve.

2. Aspect ratio
Ancho / alto (por ejemplo window.innerWidth / window.innerHeight). Si no es correcto, la imagen se ve deformada.

3. Near y Far
Distancias m�nima y m�xima de renderizado. Los objetos fuera de este rango no se dibujan. Ajustarlos bien mejora el rendimiento.

5. Renderer (WebGLRenderer)


El renderer se encarga de dibujar la escena en pantalla.

? Se crea una instancia del renderer.

? Se define su tama�o con setSize(width, height)
Normalmente se usa el tama�o de la ventana.

6. Luz Ambiental (AmbientLight)


Caracter�sticas:
? No tiene posici�n ni direcci�n
? No crea sombras
? Evita zonas totalmente negras
? Ideal como luz base

Par�metros:
? Color (0xffffff)
? Intensidad (0.5 ? suave

7. Luz Direccional (DirectionalLight)

Caracter�sticas:
? Tiene direcci�n (sol)
? Da volumen y contraste
? Puede generar sombras
? Afecta seg�n la orientaci�n del objeto

Par�metros:
? Color (0xffffff)
? Intensidad (1)
? Posici�n ? define la direcci�n de la luz

8. Geometr�a (BoxGeometry)


La geometr�a define la forma del objeto.

? BoxGeometry contiene todos los v�rtices (puntos) y caras (superficies) del cubo.
? Es la estructura matem�tica del objeto.
? M�s adelante se puede modificar o crear geometr�as m�s complejas.

9. Material (MeshBasicMaterial)


El material define c�mo se ve el objeto.

? Three.js tiene muchos materiales.
? MeshBasicMaterial es el m�s simple.
? No reacciona a las luces (color plano).
? El color usa hexadecimal, igual que en CSS o Photoshop.
0x00ff00 = verde.

10. Mesh


El mesh une la geometr�a y el material.

? Es el objeto final que se a�ade a la escena.
? Permite mover, rotar y escalar el objeto.
? Es lo que realmente "existe" dentro de la escena 3D.

Posici�n por defecto

? Al usar scene.add(), el objeto se coloca en (0, 0, 0)
? Por defecto, la c�mara tambi�n mira al origen.
? Si no se mueve la c�mara, c�mara y objeto quedan superpuestos.

Soluci�n: mover la c�mara hacia atr�s para poder ver el cubo.

11. Controles de c�mara (OrbitControls)

Permiten mover la c�mara alrededor del objeto con el rat�n. Qu� permiten:
? Rotar con clic izquierdo
? Zoom con la rueda
? Desplazar con clic derecho
? A�ade inercia al movimiento
? Hace la navegaci�n m�s suave
? Requiere llamar a controls.update() en cada frame


12. Animaci�n (animate)

Funciona como el game loop de un videojuego.

? requestAnimationFrame sincroniza la animaci�n con la pantalla
? Se ejecuta unas 60 veces por segundo

13. Movimiento autom�tico


? Rota el cubo en cada frame
? Los valores peque�os crean un movimiento suave
? La rotaci�n est� en radianes

14. Actualizaci�n y render

? controls.update() es obligatorio si hay damping
? renderer.render() dibuja la escena en pantalla


15. Ajuste al redimensionar la ventana


Evita que la escena se vea deformada al cambiar el tama�o del navegador. Qu� se actualiza:
1. camera.aspect ? nueva proporci�n ancho/alto
2. camera.updateProjectionMatrix() ? aplica el cambio
3. renderer.setSize() ? ajusta el canvas, si lo hubiera.

Investiga

1. Juega y modi?ca los objetos/parametros que hemos visto en la teoria.
? Quita luces
? Cambia camara
? Juega con los colores
? A�ade otro objeto
? etc.
2. �Puedes a�adir este render a un canvas que ya exista y hacer otro?

Soldadito Marinero (cuento)



1. Crear un soldadito de plomo usando elementos geom�tricos sencillos:
a. SphereGeometry
b. BoxGeometry
c. CylinderGeometry
2. El soldado es un solo objeto, con lo que habr� que agruparlo: THREE.Group()











02
A�adir modelo de Blender

Importando un objeto

1. Creamos los archivos de HTML y JS.
2. Necesitamos una carpeta de modelos GLB.

3. Blender
Creamos un objeto en 3d con Blender que sea de nuestro agrado.

El formato recomendado para WebGL/Three.js es GLB (Binario de GLTF). Reglas antes de exportar
? Aplicar Scale/Rotation ? Ctrl+A ? Apply All Transforms
? Todos los materiales deben ser Principled BSDF
? Usar texturas potentes: albedo, roughness, normal
? Triangular si hay problemas ? Modifier > Triangulate
? Reducir polycount si el modelo es muy pesado (ideal < 100k)
? El objeto ser� solo uno!

Importando un objeto

4. Loader
Cargamos el objeto GLB y se a�ade a la escena.

Importaci�n de objetos hechos en Blender

1. Exporta desde Blender a ?chero GLB.
2. Importa el ?chero.
3. Diferencia y trabaja con los objetos importados.
a. Moverlos
b. Duplicarlos
c. Cambiarles propiedades y material.
d. Escalarlos.











03
Zona activa

A�adir Eventos

1. Crear un elemento HTML
Crear elemento HTML identificandolo y siendo display: none;  es decir que no se ver� hasta que el evento lo active.

A�adir Eventos

2. A�adimos el evento en JS

Previamente, hay que identificar el sombrero y hacerlo cuando estamos creando el objeto:
hat.userData.name = "sombrero"; // Etiqueta para identificarlo

Raycaster es el que se encarga de saber que objeto ha sido clicado.

/*******EVENTOS *******/
// Referencia al elemento HTML
const divHola = document.getElementById('saludos');
// Variables para el Raycaster
const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2(); window.addEventListener('click', (event) => {
mouse.x = (event.clientX / window.innerWidth) * 2 - 1; mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

raycaster.setFromCamera(mouse, camera);
const intersects = raycaster.intersectObjects(soldier.children, true); if (intersects.length > 0) {
const objectHit = intersects[0].object;
if (objectHit.userData.name === "sombrero") {
// MOSTRAMOS LA CAPA
divHola.style.display = 'block'; divHola.innerHTML+="<p>Me has dado en el sombrero</p>"
// LA OCULTAMOS AUTOM�TICAMENTE despu�s de 2 segundos setTimeout(() => {
divHola.style.display = 'none';
}, 6000);

}
}});

Retos a realizar

1. Clicar un objeto (hotspot).
a. Identi?car de qu� objeto se trata.
b. Abrir, mostrar una capa (div) de HTML con informaci�n.
2. Acercar la c�mara al objeto clicado.
3. Que suene un audio/video al clicar un objeto. Pararlo al clicar otro.
4. Cerrar un elemento html abierto (una capa).
5. Apagar la luz.
6. Cambiar la textura/color de un elemento.
7. Al clicar que se pueda mover un objeto (idea: Abrir una puerta, una ventana).

Retos - soluciones


Webgraf�a

Web general: three.js Documentaci�n















