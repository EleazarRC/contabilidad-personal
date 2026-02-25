const { app, BrowserWindow } = require('electron');
const path = require('path');

// Configurar el directorio de la base de datos ANTES de cargar el backend
// En modo empaquetado, userData es una carpeta escribible del usuario
app.whenReady().then(() => {
  const userDataPath = app.getPath('userData');
  process.env.DB_DIR = userDataPath;

  // Configurar el directorio del frontend estático
  process.env.FRONTEND_DIST = path.join(__dirname, 'frontend', 'dist');

  // Arrancar el servidor Express
  const { startServer } = require('./backend/server');
  const PORT = 5000;

  startServer(PORT, () => {
    // Crear ventana principal
    const win = new BrowserWindow({
      width: 1280,
      height: 900,
      minWidth: 900,
      minHeight: 600,
      title: 'Contabilidad Personal',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      },
      autoHideMenuBar: true
    });

    win.loadURL(`http://localhost:${PORT}`);

    // En producción, quitar el menú de desarrollo
    if (app.isPackaged) {
      win.setMenu(null);
    }
  });
});

// Cerrar la app cuando todas las ventanas se cierren
app.on('window-all-closed', () => {
  app.quit();
});
