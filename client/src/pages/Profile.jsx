import { useEffect, useState } from 'react';
import { authApi, userApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from '../router';

const initialPassword = { currentPassword: '', newPassword: '' };

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: '', avatar_url: '', email: '' });
  const [password, setPassword] = useState(initialPassword);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    userApi.me()
      .then(({ data }) => setProfile(data.data))
      .catch((error) => setProfileError(error.response?.data?.message || 'We could not load your profile.'))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) navigate('/auth?returnTo=%2Fprofile');
  }, [isAuthenticated, navigate]);

  const updateProfileField = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setProfileMessage('');
    setProfileError('');
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage('');
    setProfileError('');
    try {
      const { data } = await userApi.updateMe({ name: profile.name, avatar_url: profile.avatar_url });
      setProfile(data.data);
      updateUser(data.data);
      setProfileMessage('Profile saved.');
    } catch (error) {
      setProfileError(error.response?.data?.message || 'We could not save those changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setIsSavingPassword(true);
    setPasswordMessage('');
    setPasswordError('');
    try {
      const { data } = await authApi.changePassword(password);
      setPassword({ ...initialPassword });
      setPasswordMessage(data.message || 'Password changed.');
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'We could not change your password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (!isAuthenticated) return null;
  if (isLoading) return <main className="page-width page-section"><div className="state-block">Loading your profile</div></main>;

  const displayName = profile.name || user?.email?.split('@')[0] || 'Customer';

  return (
    <main className="page-width page-section profile-page">
      <div className="page-heading">
        <div><p className="eyebrow">Account / settings</p><h1>Profile</h1></div>
        <Link className="text-button" to="/orders">View orders →</Link>
      </div>
      <div className="profile-layout">
        <aside className="profile-identity">
          <div className="avatar-frame">
            {profile.avatar_url ? <img src={profile.avatar_url} alt={`${displayName} avatar`} /> : <span>{displayName.slice(0, 1).toUpperCase()}</span>}
          </div>
          <p className="eyebrow">Signed in as</p>
          <h2>{displayName}</h2>
          <p className="profile-email">{profile.email || user?.email}</p>
          <span className="profile-role">{profile.role || user?.role}</span>
        </aside>
        <div className="profile-forms">
          <form className="profile-form" onSubmit={saveProfile}>
            <div className="form-heading"><p className="eyebrow">Personal details</p><h2>Make it yours.</h2><p>Your email stays attached to the account. Name and avatar are visible in your profile.</p></div>
            <label>Name<input value={profile.name || ''} maxLength="120" onChange={(event) => updateProfileField('name', event.target.value)} placeholder="Your name" /></label>
            <label>Avatar URL<input type="url" value={profile.avatar_url || ''} maxLength="255" onChange={(event) => updateProfileField('avatar_url', event.target.value)} placeholder="https://..." /></label>
            <div className="form-actions"><button className="button button-dark" type="submit" disabled={isSavingProfile}>{isSavingProfile ? 'Saving...' : 'Save profile'}</button>{profileMessage && <output className="form-success">{profileMessage}</output>}{profileError && <span className="field-error" role="alert">{profileError}</span>}</div>
          </form>
          <form className="profile-form" onSubmit={savePassword}>
            <div className="form-heading"><p className="eyebrow">Security</p><h2>Change password.</h2><p>Use a new password you do not reuse elsewhere.</p></div>
            <label>Current password<input type="password" required autoComplete="current-password" value={password.currentPassword} onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} /></label>
            <label>New password<input type="password" required minLength="6" autoComplete="new-password" value={password.newPassword} onChange={(event) => setPassword({ ...password, newPassword: event.target.value })} /></label>
            <div className="form-actions"><button className="button button-signal" type="submit" disabled={isSavingPassword}>{isSavingPassword ? 'Updating...' : 'Update password'}</button>{passwordMessage && <output className="form-success">{passwordMessage}</output>}{passwordError && <span className="field-error" role="alert">{passwordError}</span>}</div>
          </form>
        </div>
      </div>
    </main>
  );
}
