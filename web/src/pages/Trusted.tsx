import { useState, type CSSProperties } from 'react';
import type { PermissionLevel } from '../types';
import { useAura } from '../context/useAura';

const permissionHelp: Record<PermissionLevel, string> = {
  full: 'Full — location + alerts + check-ins',
  location: 'Location only',
  alerts: 'Alerts only',
};

export function Trusted() {
  const { contacts, addContact, updateContact, removeContact } = useAura();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [group, setGroup] = useState('Family');
  const [permission, setPermission] = useState<PermissionLevel>('full');

  const onAdd = () => {
    if (!name.trim()) return;
    addContact({ name: name.trim(), phone: phone.trim() || undefined, group, permission });
    setName('');
    setPhone('');
  };

  if (contacts.length === 0) {
    return (
      <div>
        <h1 style={{ marginTop: 0 }}>Trusted network</h1>
        <div
          role="status"
          style={{
            padding: 16,
            borderRadius: 16,
            border: '1px dashed var(--aura-border)',
            background: 'var(--aura-card)',
            marginBottom: 16,
          }}
        >
          Contacts stay on this device until a live backend is connected. Add someone you trust to get started.
        </div>
        <ContactForm
          name={name}
          setName={setName}
          phone={phone}
          setPhone={setPhone}
          group={group}
          setGroup={setGroup}
          permission={permission}
          setPermission={setPermission}
          onAdd={onAdd}
        />
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Trusted network</h1>
      <ContactForm
        name={name}
        setName={setName}
        phone={phone}
        setPhone={setPhone}
        group={group}
        setGroup={setGroup}
        permission={permission}
        setPermission={setPermission}
        onAdd={onAdd}
      />

      <h2 style={{ fontSize: 16, marginTop: 24 }}>Saved contacts</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {contacts.map((c) => (
          <li
            key={c.id}
            style={{
              padding: 14,
              borderRadius: 14,
              border: '1px solid var(--aura-border)',
              background: 'var(--aura-card)',
              marginBottom: 10,
            }}
          >
            <div style={{ fontWeight: 800 }}>{c.name}</div>
            <div style={{ fontSize: 13, color: 'var(--aura-muted)' }}>
              {c.group} · {permissionHelp[c.permission]}
            </div>
            {c.phone ? <div style={{ fontSize: 13 }}>{c.phone}</div> : null}
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 13 }}>
                Group{' '}
                <select
                  value={c.group}
                  onChange={(e) => updateContact(c.id, { group: e.target.value })}
                  aria-label={`Group for ${c.name}`}
                >
                  {['Family', 'Friends', 'Work', 'Other'].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: 13 }}>
                Permission{' '}
                <select
                  value={c.permission}
                  onChange={(e) => updateContact(c.id, { permission: e.target.value as PermissionLevel })}
                  aria-label={`Permission for ${c.name}`}
                >
                  <option value="full">Full</option>
                  <option value="location">Location only</option>
                  <option value="alerts">Alerts only</option>
                </select>
              </label>
              <button type="button" onClick={() => removeContact(c.id)} style={{ marginLeft: 'auto' }}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactForm(props: {
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  group: string;
  setGroup: (v: string) => void;
  permission: PermissionLevel;
  setPermission: (v: PermissionLevel) => void;
  onAdd: () => void;
}) {
  const { name, setName, phone, setPhone, group, setGroup, permission, setPermission, onAdd } = props;
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <label style={{ fontWeight: 700 }}>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} style={field} />
      </label>
      <label style={{ fontWeight: 700 }}>
        Phone (optional)
        <input value={phone} onChange={(e) => setPhone(e.target.value)} style={field} />
      </label>
      <label style={{ fontWeight: 700 }}>
        Group
        <select value={group} onChange={(e) => setGroup(e.target.value)} style={field}>
          {['Family', 'Friends', 'Work', 'Other'].map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>
      <fieldset style={{ border: '1px solid var(--aura-border)', borderRadius: 12, padding: 12 }}>
        <legend style={{ fontWeight: 700 }}>Permission preset</legend>
        {(['full', 'location', 'alerts'] as const).map((p) => (
          <label key={p} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input type="radio" name="perm" checked={permission === p} onChange={() => setPermission(p)} />
            <span>
              {p === 'full' ? 'Full' : p === 'location' ? 'Location only' : 'Alerts only'}
              <span style={{ color: 'var(--aura-muted)', fontSize: 13 }}> — {permissionHelp[p]}</span>
            </span>
          </label>
        ))}
        <p style={{ fontSize: 13, color: 'var(--aura-muted)', margin: '12px 0 0', lineHeight: 1.45 }}>
          Alerts can include SOS and journey notifications when connected.
        </p>
      </fieldset>
      <button type="button" onClick={onAdd} style={{ padding: 14, borderRadius: 14, fontWeight: 800 }}>
        Add contact
      </button>
    </div>
  );
}

const field: CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  padding: '12px 12px',
  borderRadius: 12,
  border: '1px solid var(--aura-border)',
};
