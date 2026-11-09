import { useState } from 'react';
import { apiRequest } from '../api';
import Icon from './Icon';

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
}

export default function ProfilePage({ user, onUserUpdated, onLogout }) {
  const [fields, setFields] = useState({
    name: user.name,
    email: user.email,
    age: user.age ?? '',
    gender: user.gender || '',
    phone: user.phone || '',
    addressLine1: user.addressLine1 || '',
    addressLine2: user.addressLine2 || '',
    city: user.city || '',
    region: user.region || '',
    postalCode: user.postalCode || '',
    country: user.country || '',
  });
  const [avatarDataUrl, setAvatarDataUrl] = useState(user.avatarDataUrl || '');
  const [profileError, setProfileError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  function changeField(event) {
    setFields((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function chooseAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setProfileError('');
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setProfileError('Choose a PNG, JPEG, or WebP image.');
      return;
    }
    if (file.size > 512 * 1024) {
      setProfileError('Your photo must be smaller than 512 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setAvatarDataUrl(reader.result);
      else setProfileError('Could not read the selected photo.');
    };
    reader.onerror = () => setProfileError('Could not read the selected photo.');
    reader.readAsDataURL(file);
  }

  async function saveProfile(event) {
    event.preventDefault();
    setProfileError('');
    setProfileMessage('');
    setSavingProfile(true);
    try {
      const result = await apiRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          ...fields,
          age: fields.age === '' ? null : Number(fields.age),
          gender: fields.gender || null,
          avatarDataUrl: avatarDataUrl || null,
        }),
      });
      onUserUpdated(result.user);
      setProfileMessage('Your profile has been saved.');
    } catch (requestError) {
      setProfileError(requestError.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Your new passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      const result = await apiRequest('/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage(result.message);
    } catch (requestError) {
      setPasswordError(requestError.message);
    } finally {
      setSavingPassword(false);
    }
  }

  async function signOut() {
    setLogoutError('');
    setSigningOut(true);
    try {
      await onLogout();
    } catch (requestError) {
      setLogoutError(requestError.message);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="profile-page">
      <form className="profile-card" onSubmit={saveProfile}>
        <h2>Personal information</h2>
        <p>Manage the details and photo associated with your account.</p>
        <div className="profile-avatar-row">
          <div className="profile-avatar">
            {avatarDataUrl ? <img src={avatarDataUrl} alt="Your profile" /> : initials(fields.name)}
          </div>
          <div className="profile-avatar-actions">
            <label>
              Change photo
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseAvatar} />
            </label>
            {avatarDataUrl && (
              <button type="button" onClick={() => setAvatarDataUrl('')}>Remove photo</button>
            )}
            <span className="muted">PNG, JPEG, or WebP · up to 512 KB</span>
          </div>
        </div>
        <div className="profile-fields">
          <label>Full name<input name="name" autoComplete="name" maxLength={100} minLength={2} onChange={changeField} required value={fields.name} /></label>
          <label>Email address<input name="email" autoComplete="email" onChange={changeField} required type="email" value={fields.email} /></label>
          <label>Age<input name="age" max={120} min={13} onChange={changeField} placeholder="Optional" type="number" value={fields.age} /></label>
          <label>
            Gender
            <select name="gender" onChange={changeField} value={fields.gender}>
              <option value="">Prefer not to say</option>
              <option value="Woman">Woman</option>
              <option value="Man">Man</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Self-describe">Self-describe</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </label>
        </div>
        <h3 className="profile-subheading">Contact and address</h3>
        <p className="profile-privacy-note">These details are optional and saved to your account.</p>
        <div className="profile-fields">
          <label>Phone number<input name="phone" autoComplete="tel" maxLength={30} onChange={changeField} placeholder="Optional" type="tel" value={fields.phone} /></label>
          <label>Street address<input name="addressLine1" autoComplete="address-line1" maxLength={160} onChange={changeField} placeholder="Optional" value={fields.addressLine1} /></label>
          <label>Apartment, suite, etc.<input name="addressLine2" autoComplete="address-line2" maxLength={160} onChange={changeField} placeholder="Optional" value={fields.addressLine2} /></label>
          <label>City<input name="city" autoComplete="address-level2" maxLength={100} onChange={changeField} placeholder="Optional" value={fields.city} /></label>
          <label>State / province / region<input name="region" autoComplete="address-level1" maxLength={100} onChange={changeField} placeholder="Optional" value={fields.region} /></label>
          <label>Postal code<input name="postalCode" autoComplete="postal-code" maxLength={24} onChange={changeField} placeholder="Optional" value={fields.postalCode} /></label>
          <label>Country<input name="country" autoComplete="country-name" maxLength={100} onChange={changeField} placeholder="Optional" value={fields.country} /></label>
        </div>
        {profileError && <p className="profile-form-message error" role="alert">{profileError}</p>}
        {profileMessage && <p className="profile-form-message success" role="status">{profileMessage}</p>}
        <div className="profile-actions">
          <button className="primary-button" disabled={savingProfile} type="submit">
            {savingProfile ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      <section className="profile-card">
        <h2>Change password</h2>
        <p>Use your current password to set a new one for this account.</p>
        <form className="profile-password-form" onSubmit={changePassword}>
          <div className="profile-fields">
            <label>Current password<input autoComplete="current-password" onChange={(event) => setCurrentPassword(event.target.value)} required type="password" value={currentPassword} /></label>
            <label>New password<input autoComplete="new-password" minLength={8} onChange={(event) => setNewPassword(event.target.value)} required type="password" value={newPassword} /></label>
            <label>Confirm new password<input autoComplete="new-password" onChange={(event) => setConfirmPassword(event.target.value)} required type="password" value={confirmPassword} /></label>
          </div>
          {passwordError && <p className="profile-form-message error" role="alert">{passwordError}</p>}
          {passwordMessage && <p className="profile-form-message success" role="status">{passwordMessage}</p>}
          <div className="profile-actions">
            <button className="primary-button" disabled={savingPassword} type="submit">
              {savingPassword ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </section>

      <section className="profile-card profile-signout">
        <div><h2>Sign out</h2><p>Sign out of your account on this device.</p></div>
        {logoutError && <p className="profile-form-message error" role="alert">{logoutError}</p>}
        <button className="danger-button" disabled={signingOut} onClick={signOut} type="button">
          <Icon name="logout" /> {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </section>
    </div>
  );
}
