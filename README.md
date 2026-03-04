# Pr05: Portfolio 3D — Jinxiong Zheng

Este es un esqueleto de proyecto de portafolio 3D basado en Three.js. Este repositorio contiene ejemplos de HTML, CSS y varios módulos JS para construir rápidamente escenas, cargar modelos GLB e implementar interacciones básicas (detección de rayos para abrir paneles de información, cambio de cámara, etc.).

## Inicio Rápido
- Se recomienda usar un servidor estático local (por ejemplo, VS Code Live Server o `npx http-server`), ya que abrir el archivo directamente podría causar fallos en la carga de módulos o videos.

Comandos de ejemplo (entorno Node.js):

```bash
# Si usas http-server
npx http-server -c-1 .

# O instala Live Server en VS Code y haz clic en "Go Live"
```

## Instrucciones de Uso

### Controles
- **Botón izquierdo del ratón**: Rotar la cámara
- **Botón central del ratón**: Mover la cámara
- **Rueda del ratón**: Zoom
- **Clic en objetos**: Mostrar paneles de información
- **Tecla ESC**: Salir del modo de aislamiento de GPU
- **Botón de restablecer vista**: Volver a la vista inicial

### Límites de la Cámara
- **Rango de zoom**: 5 a 15 unidades
- **Rango de rotación**: 45 grados a cada lado (90° en total)
- **Rango de desplazamiento**: 
  - Eje X: -5 a 5
  - Eje Y: 0 a 2
  - Eje Z: -5 a 5

## Estructura del Proyecto (archivos creados)
- `index.html` Punto de entrada principal (contiene paneles UI e importmap)
- `css/style.css` Estilos básicos
- `js/main.js` Lógica principal de escena y renderizado
- `js/interactions.js` Detección de rayos y activación de paneles UI
- `js/cameraManager.js` Esqueleto de transición/restablecimiento de cámara
- `js/uiManager.js` Gestión de visualización/ocultación de paneles HTML

## Modelos y Recursos
- Coloque los archivos `.glb` exportados en los directorios correspondientes `assets/models/static/` y `assets/models/interactive/`.
- Coloque los videos en `assets/videos/` y las imágenes en `assets/images/`.

## Convención de Nombres (resumen)
- Los objetos interactivos deben nombrarse en Blender, por ejemplo `graphics_card`, `pool_table`, `main_screen`, `blackboard`. Después de exportar, el código los identificará a través de `userData.type` o `object.name`.

## Instrucciones de Despliegue

### Alojamiento Estático
Este proyecto puede desplegarse en cualquier servicio de alojamiento estático:

#### GitHub Pages
1. Empuje el código a un repositorio de GitHub
2. Vaya a Configuración del repositorio > Pages
3. Seleccione la rama para desplegar (generalmente `main` o `master`)
4. Su sitio estará disponible en `https://[usuario].github.io/[nombre-repositorio]`

#### Netlify
1. Cree una cuenta en [netlify.com](https://www.netlify.com)
2. Arrastre y suelte la carpeta del proyecto en el panel de Netlify
3. Su sitio se desplegará instantáneamente con una URL aleatoria
4. Puede personalizar el dominio en la configuración del sitio

#### Vercel
1. Instale Vercel CLI: `npm i -g vercel`
2. Ejecute `vercel` en el directorio del proyecto
3. Siga las instrucciones para desplegar
4. Su sitio estará disponible con un dominio `.vercel.app`

### Servidor Personalizado
Para mayor control, puede desplegar en un servidor personalizado:

1. Suba todos los archivos del proyecto a su servidor web
2. Asegúrese de configurar correctamente los tipos MIME para archivos `.glb`
3. Configure CORS si es necesario para recursos externos
4. Configure HTTPS para conexiones seguras

## Compatibilidad del Navegador

- Chrome/Edge: ✅ Totalmente compatible
- Firefox: ✅ Totalmente compatible
- Safari: ✅ Totalmente compatible
- Opera: ✅ Totalmente compatible

## Solución de Problemas

### Los modelos no cargan
- Asegúrese de que todos los archivos de modelo estén en el directorio correcto
- Verifique si hay mensajes de error en la consola del navegador
- Valide que el servidor esté sirviendo archivos `.glb` con el tipo MIME correcto

### Problemas de rendimiento
- Intente reducir la relación de píxeles en `main.js`
- Cierre otras pestañas del navegador para liberar recursos
- Actualice los controladores gráficos
- Use un navegador moderno para obtener un mejor rendimiento

### Los controles no responden
- Asegúrese de hacer clic en el área del lienzo
- Verifique que JavaScript esté habilitado en su navegador
- Intente actualizar la página

## Comentarios y Soporte

¡Apreciamos sus comentarios y sugerencias! Siéntase libre de:

- **Reportar problemas**: Crear un issue en GitHub
- **Solicitar funciones**: Usar el rastreador de issues para sugerir nuevas funciones
- **Contacto directo**: jinxiong@example.com | @jinxiong_art

## Sugerencias Futuras
- Agregar transiciones suaves de cámara (por ejemplo, usando `tween.js`)
- Implementar comportamientos de clic más detallados en `interactions.js` (física de las bolas, modo de aislamiento de GPU)
- Exportar y colocar modelos `.glb` para verificar el flujo de carga
