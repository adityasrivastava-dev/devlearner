import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './UserBar.module.css';

export default function UserBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  const initial = (user.name || user.email || 'U')[0].toUpperCase();

  return (
    <div className={styles.userBar}>
      <div className={styles.avatarWrap}>
        {user.avatar ? (
          <img src={user.avatar} alt="" className={styles.avatar}
            onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <div className={styles.avatarInitial}>{initial}</div>
        )}
      </div>

      <div className={styles.info}>
        <div className={styles.name}>{user.name || user.email}</div>
        <div className={styles.stat}>
          {user.streak > 0
            ? <span className={styles.streak}>🔥 {user.streak} day streak</span>
            : <span>✅ {user.solved || 0} solved</span>}
        </div>
      </div>

      <div className={styles.menuWrap}>
        <button className={styles.menuBtn} onClick={() => setShowMenu((v) => !v)} title="Menu">⋮</button>
        {showMenu && (
          <>
            <div className={styles.overlay} onClick={() => setShowMenu(false)} />
            <div className={styles.menu}>
              <button onClick={() => { navigate('/'); setShowMenu(false); }}>
                ⌂ Dashboard
              </button>
              <button onClick={() => { navigate('/profile'); setShowMenu(false); }}>
                👤 Profile
              </button>
              <button onClick={() => { navigate('/problems'); setShowMenu(false); }}>
                📋 Problems
              </button>
              <button onClick={() => { navigate('/roadmap'); setShowMenu(false); }}>
                🗺 Roadmaps
              </button>
              <div className={styles.menuDivider} />
              <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>
                ⏏ Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}