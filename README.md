# Stocks-Trabajo

Sistema web simple para controlar stock por proveedor, guardar registros con fecha/hora automática y calcular promedios de venta (faltante) por producto y por proveedor.

## 1) Crear el proyecto desde cero en Visual Studio Code

1. **Crear carpeta del proyecto**
   - Ejemplo: `Stocks-Trabajo`.
2. **Abrir la carpeta en VS Code**
   - Menú: `File > Open Folder`.
3. **Crear archivos base**
   - `index.html`
   - `styles.css`
   - `app.js`
4. **Abrir `index.html` con Live Server** (extensión opcional)
   - Click derecho sobre `index.html` > `Open with Live Server`.

## 2) ¿Qué hace cada archivo?

### `index.html`
Define la estructura de la página:
- Encabezado con título.
- Menú lateral de proveedores.
- Grilla de productos con columnas `Exhibido` y `Depósito`.
- Caja de fecha/hora en vivo.
- Selector de período (semanal, quincenal, mensual).
- Botón **Enviar**.
- Sección de promedios y gráfico de ventas.

### `styles.css`
Define el diseño visual:
- Estilo general de paneles y bordes.
- Pestañas laterales de proveedores.
- Estilo de tabla y botón de enviar con forma de flecha.
- Tooltip con imagen al pasar por el símbolo `?`.
- Diseño responsive para pantallas chicas.

### `app.js`
Contiene la lógica de negocio:
- Datos iniciales de proveedores/productos.
- Renderizado dinámico de pestañas y tabla.
- Reloj y fecha automáticos (`setInterval`).
- Guardado de datos en `localStorage` solo al hacer click en **Enviar**.
- Cálculo de ventas por faltante:
  - `vendido = max(stock_anterior - stock_actual, 0)`
- Promedios por producto y por proveedor según período elegido.
- Gráfico tipo inversores (línea) usando Chart.js.

## 3) Lógica funcional (resumen)

1. Elegís proveedor en la izquierda.
2. Cargás cantidades en grilla (`Exhibido` y `Depósito`).
3. El símbolo `?` muestra imagen de referencia del producto.
4. Al presionar **Enviar** se guardan:
   - Fecha/hora actual.
   - Cantidades cargadas de ese proveedor.
5. El sistema actualiza:
   - Tabla de promedio vendido por producto.
   - Tabla de promedio vendido por proveedor.
   - Gráfico de línea con ventas promedio.

## 4) Subir a GitHub paso a paso

### Crear repositorio remoto
1. Ir a GitHub > `New repository`.
2. Nombre sugerido: `Stocks-Trabajo`.
3. Crear repo vacío.

### Subir proyecto local
```bash
git init
git add .
git commit -m "feat: sistema inicial de stock con promedios y gráfico"
git branch -M main
git remote add origin <URL_DEL_REPO>
git push -u origin main
```

### Flujo recomendado para seguir iterando
```bash
git checkout -b feature/nueva-mejora
# cambios...
git add .
git commit -m "feat: descripción"
git push -u origin feature/nueva-mejora
```
Luego abrir Pull Request en GitHub.

## 5) Próximos pasos recomendados

- Conectar a base de datos real (Supabase, Firebase o backend Node + PostgreSQL).
- Agregar autenticación por usuario.
- Cargar imágenes propias en lugar de URLs externas.
- Exportar reportes a Excel/PDF.
- Agregar filtros por rango exacto de fechas.
