# Requirements: Sistema de Gestión de Inventario y Ventas — Tobón Distribuidora de Belleza

## Problema

La empresa **Tobón Distribuidora de Belleza** es una distribuidora de productos de belleza que actualmente no cuenta con un sistema digital para gestionar su inventario ni sus ventas. La dueña ha sufrido robos por parte de personas que dejó a cargo del negocio, al no existir un mecanismo que registre y controle el movimiento real de productos y dinero.

Se necesita un sistema que:
1. Dé visibilidad y control total sobre el inventario (qué hay, cuánto hay, qué se vendió).
2. Registre cada venta de forma trazable y auditable, generando recibos.
3. Permita identificar patrones de venta (productos más vendidos, horas pico, días de mayor flujo) para tomar decisiones de negocio.
4. Siente las bases para un programa de fidelización de clientes a futuro.
5. Cumpla con la normativa colombiana de protección de datos personales (Ley 1581 de 2012).

## Actores

- **Dueña / Administradora:** Control total del sistema. Carga productos, consulta reportes y analíticas, gestiona usuarios.
- **Vendedor(a) / Cajero(a):** Persona a cargo de la tienda. Puede buscar productos (incluyendo escaneo de código de barras), registrar ventas, generar recibos y consultar el inventario. **No** puede modificar precios, eliminar productos ni acceder a analíticas.
- **Cliente:** No accede al sistema directamente. Su información se registra en el punto de venta para fidelización futura.

## Comportamiento esperado

### Módulo 1: Gestión de Inventario

#### Flujo principal — Alta de producto
1. La administradora accede al módulo de inventario.
2. Crea un nuevo producto proporcionando:
   - Nombre del producto
   - Descripción
   - Categoría (ej: cabello, uñas, maquillaje, cuidado de piel, herramientas)
   - Marca
   - Precio de compra (costo)
   - Precio de venta
   - Cantidad en stock
   - Código de barras (ingresado manualmente o escaneado con la cámara del celular)
   - Foto del producto (tomada con la cámara o subida desde galería)
3. El sistema valida que no exista otro producto con el mismo código de barras.
4. El producto queda registrado y visible en el inventario.

#### Flujos alternativos
- **Edición de producto:** La administradora puede modificar cualquier campo (precio, stock, descripción, foto).
- **Baja lógica de producto:** Un producto se puede desactivar (no eliminar) para que no aparezca en búsquedas de venta pero se conserve el historial.
- **Ajuste de inventario:** La administradora puede ajustar la cantidad manualmente (por merma, devolución, o conteo físico), registrando el motivo del ajuste.
- **Alerta de stock bajo:** El sistema muestra indicadores visuales cuando un producto tiene stock menor a un umbral configurable (default: 5 unidades).

### Módulo 2: Punto de Venta (POS)

#### Flujo principal — Registrar venta
1. El vendedor abre el módulo de ventas desde el celular.
2. Escanea el código de barras de un producto usando la cámara del dispositivo.
3. El sistema identifica el producto y lo agrega al carrito de la venta actual.
4. El vendedor puede agregar más productos (repitiendo el escaneo o buscando manualmente por nombre).
5. El vendedor puede ajustar la cantidad de cada ítem.
6. El sistema muestra el total de la venta en tiempo real.
7. (Opcional) El vendedor asocia un cliente existente o registra uno nuevo.
8. El vendedor selecciona el método de pago (efectivo, transferencia/Nequi, tarjeta).
9. El vendedor confirma la venta.
10. El sistema:
    - Descuenta automáticamente del inventario.
    - Genera un recibo digital con número consecutivo, detalle de productos, totales, fecha/hora.
    - Permite compartir el recibo (WhatsApp, PDF descargable).

#### Flujos alternativos
- **Búsqueda manual:** Si no se puede escanear, el vendedor busca por nombre o parte del código.
- **Producto sin stock:** El sistema impide vender un producto con stock en cero, mostrando alerta.
- **Cancelación de venta:** Una venta puede cancelarse antes de confirmar. Después de confirmada, solo la administradora puede anularla (devolviendo stock y marcando la venta como anulada, no eliminada).
- **Venta sin cliente:** Se permite. El cliente se asocia opcionalmente.

### Módulo 3: Gestión de Clientes

#### Flujo principal — Registro de cliente
1. En el punto de venta o desde un módulo dedicado, se registra:
   - Nombre
   - Apellido
   - Teléfono
   - Correo electrónico (opcional)
   - Cédula (documento de identidad)
2. El cliente debe aceptar la autorización de tratamiento de datos personales (texto conforme a Ley 1581 de 2012).
3. El sistema almacena la autorización con timestamp.

#### Flujos alternativos
- **Cliente existente:** Se busca por cédula o nombre. No se crean duplicados.
- **Actualización de datos:** El cliente puede solicitar la actualización o eliminación de sus datos (derecho de habeas data).

### Módulo 4: Analíticas y Reportes (solo Administradora)

- **Productos más vendidos:** Ranking por cantidad y por ingresos, filtrable por período.
- **Horas de mayor flujo:** Gráfico de distribución de ventas por hora del día.
- **Días del mes con mayor movimiento:** Mapa de calor o gráfico de barras por día.
- **Ticket promedio:** Valor promedio por transacción.
- **Rentabilidad por producto:** Margen entre costo y precio de venta (si se registran costos).
- **Historial de ajustes de inventario:** Para auditoría interna.
- **Ventas por vendedor:** Si hay más de un vendedor, quién vendió qué y cuándo.

### Módulo 5: Seguridad y Auditoría

- Todo acceso y operación relevante queda registrado en un log de auditoría (quién, qué, cuándo, desde dónde).
- Las ventas confirmadas y las anulaciones son inmutables una vez registradas (solo se anulan, no se eliminan ni editan).
- RLS (Row Level Security) en Supabase para que cada rol vea solo lo que le corresponde.
- Autenticación por email/contraseña con posibilidad de agregar 2FA a futuro.
- Se usará **Cloudflare Security Audit Skill** para auditar el código antes de cada release mayor.

### Módulo 6: Política de Tratamiento de Datos Personales

- El sistema debe incluir una página pública con la **Política de Tratamiento de Datos Personales** de Tobón Distribuidora de Belleza, conforme a la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013.
- Al registrar un cliente, el sistema debe mostrar una versión resumida de la autorización y obtener consentimiento explícito (checkbox + timestamp).
- La política debe incluir como mínimo:
  - Identificación del responsable del tratamiento (razón social, NIT, dirección, contacto).
  - Finalidades del tratamiento.
  - Derechos de los titulares (acceso, rectificación, actualización, supresión, revocatoria).
  - Carácter facultativo de las respuestas sobre datos sensibles.
  - Mecanismos para ejercer derechos (canal de contacto).
  - Procedimiento para consultas y reclamos (plazos legales: 10 días hábiles consulta, 15 días reclamo).

## Restricciones

### Técnicas
- **Frontend:** Next.js (App Router, React Server Components donde aplique).
- **Backend / BaaS:** Supabase (PostgreSQL, Auth, Storage, Realtime, RLS).
- **Hosting:** A definir (Vercel es la opción natural para Next.js).
- **Escaneo de código de barras:** Debe funcionar desde el navegador móvil usando la API de la cámara. No se requiere app nativa. Librería sugerida: `html5-qrcode` o `zxing-js/browser`.
- **Almacenamiento de fotos:** Supabase Storage con buckets protegidos.
- **Idioma del sistema:** Español (Colombia).

### Seguridad
- RLS habilitado en todas las tablas con datos de negocio.
- Políticas de acceso por rol (admin vs. vendedor).
- Validación server-side de todas las operaciones de escritura.
- HTTPS obligatorio.
- Sanitización de inputs.
- Rate limiting en endpoints sensibles.
- Auditoría con Cloudflare Security Audit Skill integrada al flujo de desarrollo.

### Legal
- Cumplimiento de Ley 1581 de 2012 (Protección de Datos Personales).
- Cumplimiento de Decreto 1377 de 2013 (reglamentario).
- Registro de autorización de tratamiento de datos con evidencia verificable (timestamp, IP si aplica).

## Fuera de alcance (v1)

- **Programa de fidelización:** Se prepara la estructura de datos (clientes + historial de compras) pero NO se implementan puntos, descuentos ni niveles.
- **Facturación electrónica DIAN:** No se emiten facturas electrónicas. Los recibos son comprobantes internos.
- **E-commerce / catálogo público:** El sistema es de uso interno (administración + punto de venta).
- **Gestión de proveedores / compras:** No se registran órdenes de compra ni proveedores.
- **Multi-sede:** Se asume una sola ubicación física.
- **Integración con pasarelas de pago:** El método de pago se registra informativamente. No se procesa pago electrónico dentro del sistema.
- **App nativa (iOS/Android):** Se usa como PWA desde el navegador. No se publica en tiendas.
- **Impresión de código de barras:** Se asume que los productos ya traen su código de barras del fabricante.

## Criterios de aceptación

- [ ] Un producto puede ser cargado al inventario con todos sus campos (nombre, descripción, foto, código de barras, categoría, marca, precios, stock).
- [ ] El código de barras se puede escanear con la cámara del celular desde el navegador, tanto para cargar productos como para buscarlos al vender.
- [ ] Una venta registrada descuenta automáticamente el stock de cada producto involucrado.
- [ ] Se genera un recibo digital con número consecutivo, detalle de productos, total, fecha/hora, y se puede compartir por WhatsApp o descargar como PDF.
- [ ] Un cliente puede registrarse con nombre, apellido, teléfono, email, cédula, aceptando la autorización de datos.
- [ ] La administradora puede ver un dashboard con: productos más vendidos, horas pico, días de mayor movimiento, ticket promedio.
- [ ] Un vendedor NO puede acceder a reportes, modificar precios ni eliminar productos.
- [ ] Existe una página pública con la Política de Tratamiento de Datos conforme a Ley 1581/2012.
- [ ] Todas las tablas con datos de negocio tienen RLS habilitado y políticas configuradas por rol.
- [ ] Existe un log de auditoría que registra operaciones críticas (ventas, anulaciones, ajustes de inventario, cambios de precio).
- [ ] El sistema es usable desde un celular (responsive / mobile-first).
- [ ] Se ejecuta al menos una auditoría de seguridad con Cloudflare Security Audit Skill antes del primer despliegue.
