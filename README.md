# Stocks-Trabajo

Sistema web para control de stock por proveedor con:
- grilla 3x10 (Producto / Exhibido / Depósito),
- fecha y hora en tiempo real,
- guardado solo al presionar **Enviar**,
- análisis por proveedor/producto/período,
- reset total de datos.

## Estructura del proyecto

- `index.html`: estructura de la página (diseño principal + análisis).
- `styles.css`: estilos visuales (layout, tabs, grilla, tooltips, botones).
- `app.js`: lógica de negocio (render, guardado, cálculos de promedios, gráfico).
- `main.js`: punto de entrada para iniciar el demo.

## Cómo correrlo en Visual Studio Code (paso a paso)

1. Abrí la carpeta del proyecto en VS Code.
2. Instalá la extensión **Live Server** (opcional, recomendada).
3. Abrí `index.html`.
4. Click derecho en `index.html` > **Open with Live Server**.
5. Se abrirá en el navegador (ejemplo: `http://127.0.0.1:5500/index.html`).

### Alternativa sin Live Server

Desde terminal en la carpeta del proyecto:

```bash
python3 -m http.server 8000
```

Luego abrir:

```text
http://localhost:8000/index.html
```

## Flujo funcional

1. Elegís un proveedor del menú izquierdo.
2. Cargás cantidades en la grilla (10 filas por proveedor).
3. El símbolo `?` ya deja el espacio preparado para la imagen futura.
4. Al presionar **Enviar**, recién ahí se guarda:
   - fecha/hora actuales,
   - datos de la grilla del proveedor activo.
5. Abajo, en análisis, podés filtrar por:
   - todos los proveedores o uno,
   - todos los productos o uno,
   - período semanal/quincenal/mensual.
6. Botón **Eliminar todos los datos**:
   - borra todo el historial guardado en `localStorage`.

## Cómo se calcula la venta

Entre una carga y la siguiente del mismo producto:

```text
vendido = max((exhibido_anterior + deposito_anterior) - (exhibido_actual + deposito_actual), 0)
```

Luego se calculan promedios por producto y por proveedor según el período seleccionado.

## Subir a GitHub

```bash
git add .
git commit -m "feat: ajustar demo de stock con grilla 3x10 y analisis filtrable"
git push
```
