# 🚀 Guía de Ejecución Local de ConectaVet (Paso a Paso)

Esta guía está diseñada para que cualquier persona del equipo (incluso sin experiencia previa programando) pueda encender todo el sistema ConectaVet (Base de datos, Web y App Móvil) en su propia computadora y probarlo con su celular conectado por cable.

---

## 🛠️ PARTE 1: Lo que tenés que instalar en la PC

Antes de empezar, asegurate de tener instalados estos 3 programas base (si ya los tenés, podés saltar este paso):

1. **Node.js**: Es el motor que hace funcionar todo. Descargá la versión "LTS" (Recomendada) desde [nodejs.org](https://nodejs.org/). Instalalo dándole "Siguiente" a todo.
2. **Git**: Nos permite descargar el código. Descargalo desde [git-scm.com](https://git-scm.com/) e instalalo (siguiente a todo).
3. **Visual Studio Code (VS Code)**: Es el programa donde vamos a abrir las carpetas. Descargalo desde [code.visualstudio.com](https://code.visualstudio.com/).

---

## 📱 PARTE 2: Preparar el Celular (Android)

Como en la empresa las redes Wi-Fi a veces bloquean conexiones, la forma más segura de probar la app es **por cable USB**.

1. Instalá la aplicación **Expo Go** desde la Google Play Store.
2. **Activar Modo Desarrollador:**
   - Ve a los *Ajustes* de tu celular > *Acerca del teléfono*.
   - Tocá 7 veces seguidas donde dice **"Número de compilación"** (o Versión MIUI) hasta que diga "¡Ya eres desarrollador!".
3. **Activar Depuración USB:**
   - Volvé atrás en Ajustes, buscá *Opciones de desarrollador* (a veces está dentro de Sistema o Ajustes adicionales).
   - Activá la opción que dice **Depuración por USB**.
4. **Conectá el celular a la PC** con el cable USB. Si en la pantalla del celular te pregunta "¿Permitir depuración USB?", marcá "Permitir siempre" y dale a Aceptar.

---

## 💻 PARTE 3: Encender el Sistema

Abrí **Visual Studio Code**. Arriba en el menú tocá `Terminal` -> `New Terminal` (Nueva terminal). Vas a ver que se abre un recuadro abajo para escribir comandos.

Debemos encender **tres partes** por separado. Lo ideal es abrir **3 pestañas de terminal distintas** (usando el botón `+` en la ventana de terminal de VS Code).

### Terminal 1: El Backend (El Cerebro)
1. Escribí el siguiente comando para entrar a la carpeta del backend y presioná Enter:
   ```bash
   cd backend
   ```
2. Descargá las dependencias necesarias:
   ```bash
   npm install
   ```
3. **Atención a las claves:** Asegurate de tener un archivo llamado `.env` dentro de la carpeta `backend` (si no existe, copiá el `.env.example`, renombralo a `.env` y pedile a un desarrollador que te pase las claves reales de base de datos y LiveKit).
4. Encendé el servidor:
   ```bash
   npm run dev
   ```
   *(Debería decirte que el servidor está corriendo en el puerto 3000 o 3001).*

### Terminal 2: La Web (Panel Administrativo)
1. Abrí una **segunda pestaña** de terminal (botón `+`).
2. Entrá a la carpeta web:
   ```bash
   cd web
   ```
3. Descargá las dependencias:
   ```bash
   npm install
   ```
4. Encendé la página web:
   ```bash
   npm run dev
   ```
   *(Te dará un enlace tipo `http://localhost:5173`. Si le hacés Ctrl + Clic, se abrirá en tu navegador).*

### Terminal 3: La App Móvil (Expo)
1. Abrí una **tercera pestaña** de terminal.
2. Entrá a la carpeta móvil:
   ```bash
   cd mobile
   ```
3. Descargá las dependencias:
   ```bash
   npm install
   ```
4. Encendé el servidor de la app y prepará el cable:
   ```bash
   npm start
   ```
5. Al ejecutar esto, el sistema ejecutará un script especial que busca automáticamente tu celular por USB, configura los puertos de red y te abre una imagen con un código QR (por las dudas) en tu computadora.

### ¿Cómo lo abro en el celular por cable?
Como tenés el celular conectado por cable con la "Depuración USB" activa, **no hace falta escanear el QR**.
Simplemente hacé un clic en esa misma terminal y presioná la tecla **`a`** (de Android) en tu teclado.
La PC se comunicará por el cable con el celular, abrirá Expo Go automáticamente y cargará ConectaVet sin depender de la red Wi-Fi de la empresa.

---

## ⚠️ Precauciones y Posibles Errores

* **"Network Error" o pantalla roja en el celular:**
  Significa que el celular no puede comunicarse con la computadora. 
  *Solución:* Asegurate de que el cable está bien conectado. En la terminal del móvil, presioná la tecla `Shift + R` para reiniciar, o presiona `a` nuevamente.
* **Fallas al escanear el QR:**
  Si intentas escanear el QR con la cámara y no carga, es porque la red Wi-Fi de la empresa bloquea la conexión (Client Isolation). Por eso **es obligatorio** usar el cable y presionar la tecla `a`.
* **Las videollamadas no funcionan:**
  Asegurate de que las claves de *LiveKit* estén correctamente pegadas en tu archivo `.env` del backend y en el `.env` de la web/app. Si faltan, la cámara nunca se va a encender.
* **El backend arroja textos rojos en la terminal:**
  Normalmente es porque falta el archivo `.env` o la base de datos (Supabase) superó el límite de conexiones. Frená el backend tocando `Ctrl + C` y volvé a escribir `npm run dev`.

¡Listo! Con estas 3 terminales corriendo, ya tenés el control absoluto de ConectaVet en tu PC.
