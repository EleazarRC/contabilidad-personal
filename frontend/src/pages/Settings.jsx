import { useState, useEffect } from 'react';
import { getDataStats, deleteAllData } from '../services/api';
import { useNavigate } from 'react-router-dom';

function Settings() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await getDataStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setError('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (deleteConfirm !== 'DELETE_ALL_DATA') {
      setError('Debes escribir exactamente "DELETE_ALL_DATA" para confirmar');
      return;
    }

    if (!window.confirm('⚠️ ¿ESTÁS COMPLETAMENTE SEGURO? Esta acción NO se puede deshacer. Se borrarán:\n\n• Todas las transacciones\n• Todas las previsiones\n• Todas las categorías personalizadas\n\n¿Continuar?')) {
      return;
    }

    try {
      setIsDeleting(true);
      setError('');
      setSuccess('');

      await deleteAllData(deleteConfirm);

      setSuccess('✅ Todos los datos han sido eliminados correctamente');
      setDeleteConfirm('');

      // Recargar estadísticas
      setTimeout(() => {
        loadStats();
      }, 1000);

      // Redireccionar al dashboard después de 2 segundos
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      setError(error.response?.data?.error || 'Error al eliminar datos');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <h2 style={{ color: '#667eea', marginBottom: '1.5rem' }}>⚙️ Configuración</h2>

      {/* Estadísticas */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ color: '#667eea', marginBottom: '1rem' }}>📊 Estadísticas de Datos</h3>

        {loading ? (
          <div className="loading">Cargando estadísticas...</div>
        ) : stats ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '1.5rem',
              borderRadius: '8px',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.transactions}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Transacciones</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              padding: '1.5rem',
              borderRadius: '8px',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.forecasts}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Previsiones</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              padding: '1.5rem',
              borderRadius: '8px',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.categories}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Categorías</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              padding: '1.5rem',
              borderRadius: '8px',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.savingsAccounts || 0}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Cuentas de Ahorro</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              padding: '1.5rem',
              borderRadius: '8px',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.debtAccounts || 0}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Deudas</div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#666' }}>No se pudieron cargar las estadísticas</p>
        )}
      </div>

      {/* Backup / Exportación */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ color: '#28a745', marginBottom: '1rem' }}>💾 Exportar / Backup</h3>
        <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '1rem' }}>
          Descarga una copia completa de tu base de datos. Incluye todas las transacciones,
          previsiones, categorías, cuentas de ahorro y deudas.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => {
            const link = document.createElement('a');
            link.href = 'http://localhost:3001/api/settings/backup';
            link.download = '';
            link.click();
          }}
          style={{ background: 'linear-gradient(135deg, #28a745, #20c997)' }}
        >
          📥 Descargar Backup (.sqlite)
        </button>
      </div>

      {/* Zona de Peligro */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)',
        border: '2px solid #dc3545'
      }}>
        <h3 style={{ color: '#dc3545', marginBottom: '1rem' }}>⚠️ Zona de Peligro</h3>

        <div style={{
          background: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ffcccc',
          marginBottom: '1rem'
        }}>
          <h4 style={{ color: '#dc3545', marginBottom: '0.5rem' }}>Borrar Todos los Datos</h4>
          <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '1rem' }}>
            Esta acción eliminará <strong>permanentemente</strong>:
          </p>
          <ul style={{ color: '#666', lineHeight: '1.8', marginBottom: '1rem' }}>
            <li>✗ Todas las transacciones (ingresos y gastos)</li>
            <li>✗ Todas las previsiones (mensuales y anuales)</li>
            <li>✗ Todas las cuentas y movimientos de ahorro</li>
            <li>✗ Todas las deudas y sus pagos</li>
            <li>✗ Todas las categorías personalizadas</li>
          </ul>
          <p style={{
            background: '#fff3cd',
            padding: '0.75rem',
            borderRadius: '4px',
            color: '#856404',
            fontWeight: 600,
            marginBottom: '1rem'
          }}>
            ⚠️ Esta acción NO se puede deshacer. Los datos se perderán para siempre.
          </p>

          {error && (
            <div className="message error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="message success" style={{ marginBottom: '1rem', background: '#d4edda', color: '#155724', padding: '1rem', borderRadius: '8px' }}>
              {success}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600, color: '#dc3545' }}>
              Para confirmar, escribe: <code style={{ background: '#f8d7da', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>DELETE_ALL_DATA</code>
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE_ALL_DATA"
              style={{
                marginTop: '0.5rem',
                fontFamily: 'monospace',
                borderColor: deleteConfirm === 'DELETE_ALL_DATA' ? '#dc3545' : '#e0e0e0'
              }}
              disabled={isDeleting}
            />
          </div>

          <button
            className="btn btn-danger"
            onClick={handleDeleteAll}
            disabled={deleteConfirm !== 'DELETE_ALL_DATA' || isDeleting}
            style={{
              background: deleteConfirm === 'DELETE_ALL_DATA' ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' : '#ccc',
              cursor: deleteConfirm === 'DELETE_ALL_DATA' && !isDeleting ? 'pointer' : 'not-allowed',
              opacity: deleteConfirm === 'DELETE_ALL_DATA' && !isDeleting ? 1 : 0.6
            }}
          >
            {isDeleting ? '⏳ Eliminando...' : '🗑️ Borrar Todos los Datos'}
          </button>
        </div>
      </div>

      {/* Información */}
      <div className="card" style={{
        marginTop: '1.5rem',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)'
      }}>
        <h3 style={{ color: '#667eea', marginBottom: '1rem' }}>ℹ️ Información</h3>
        <ul style={{ lineHeight: '1.8', color: '#555' }}>
          <li>Las categorías predeterminadas del sistema se mantendrán</li>
          <li>Puedes volver a importar tus datos si tienes un respaldo</li>
          <li>Esta acción es útil para empezar de cero o limpiar datos de prueba</li>
          <li>Considera hacer una copia de la base de datos antes de borrar</li>
        </ul>
      </div>

      {/* Botón volver */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/')}
        >
          ← Volver al Dashboard
        </button>
      </div>
    </div>
  );
}

export default Settings;
