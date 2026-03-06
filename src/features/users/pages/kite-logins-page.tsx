import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kiteUsersService, type CreateKiteCredentialRequest, type KiteCredential } from '@/services/api/kite-users.service';
import { mapHttpError } from '@/services/http/error-mapper';
import { AsyncState } from '@/shared/components/async-state';
import { queryKeys } from '@/shared/lib/query-keys';

type FormState = {
  username: string;
  password: string;
  email: string;
  kiteApiKey: string;
  kiteApiSecret: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  username: '',
  password: '',
  email: '',
  kiteApiKey: '',
  kiteApiSecret: '',
};

type ConnectState = {
  credentialId: number;
  username: string;
  email: string;
  kiteApiKey: string;
  secret: string;
};

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.username.trim()) errors.username = 'Username is required.';
  else if (form.username.trim().length > 100) errors.username = 'Username must be 100 characters or less.';

  if (!form.email.trim()) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  else if (form.email.trim().length > 200) errors.email = 'Email must be 200 characters or less.';

  if (!form.kiteApiKey.trim()) errors.kiteApiKey = 'Kite API Key is required.';
  else if (form.kiteApiKey.trim().length > 50) errors.kiteApiKey = 'API Key must be 50 characters or less.';

  if (!form.kiteApiSecret.trim()) errors.kiteApiSecret = 'Kite API Secret is required.';
  else if (form.kiteApiSecret.trim().length > 100) errors.kiteApiSecret = 'API Secret must be 100 characters or less.';

  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="error-text" style={{ marginTop: 4, marginBottom: 0 }}>{message}</p>;
}

export function KiteLoginsPage() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const [connectState, setConnectState] = useState<ConnectState | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<number | null>(null);

  const credentialsQuery = useQuery({
    queryKey: queryKeys.kiteCredentials,
    queryFn: kiteUsersService.getCredentials,
  });

  const createMutation = useMutation({
    mutationFn: (req: CreateKiteCredentialRequest) => kiteUsersService.createCredential(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kiteCredentials });
      setForm(EMPTY_FORM);
      setFieldErrors({});
      setTouched({});
      setApiError(null);
    },
    onError: (err) => setApiError(mapHttpError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => kiteUsersService.deleteCredential(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.kiteCredentials }),
    onError: (err) => setConnectError(mapHttpError(err)),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      kiteUsersService.updateCredential(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.kiteCredentials }),
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const key = name as keyof FormState;
    const updated = { ...form, [key]: value };
    setForm(updated);
    // Re-validate touched field immediately
    if (touched[key]) {
      setFieldErrors(validateForm(updated));
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const key = e.target.name as keyof FormState;
    setTouched((prev) => ({ ...prev, [key]: true }));
    setFieldErrors(validateForm(form));
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    // Mark all fields touched on submit
    setTouched({ username: true, email: true, kiteApiKey: true, kiteApiSecret: true });
    const errors = validateForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setApiError(null);
    createMutation.mutate({
      username: form.username.trim(),
      email: form.email.trim(),
      kiteApiKey: form.kiteApiKey.trim(),
      kiteApiSecret: form.kiteApiSecret.trim(),
    });
  }

  function openConnectPanel(cred: KiteCredential) {
    setConnectError(null);
    setConnectState({
      credentialId: cred.id,
      username: cred.username,
      email: cred.email,
      kiteApiKey: cred.kiteApiKey,
      secret: '',
    });
  }

  async function handleConnect() {
    if (!connectState) return;
    if (!connectState.secret.trim()) {
      setConnectError('Enter the Kite API secret to connect.');
      return;
    }
    setConnectingId(connectState.credentialId);
    setConnectError(null);
    try {
      const loginUrl = await kiteUsersService.getLoginUrl({
        username: connectState.username,
        email: connectState.email,
        kiteApiKey: connectState.kiteApiKey,
        kiteApiSecret: connectState.secret,
      });
      window.open(loginUrl, '_blank', 'noopener,noreferrer');
      setConnectState(null);
    } catch (err) {
      setConnectError(mapHttpError(err));
    } finally {
      setConnectingId(null);
    }
  }

  const hasErrors = Object.keys(fieldErrors).length > 0;
  const credentials = credentialsQuery.data ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Add Credential Form ── */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <h2 className="section-title" style={{ marginBottom: 16 }}>Add Kite Login</h2>

        <form onSubmit={handleAdd} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px 20px' }}>

            <div className="form-group">
              <label className="helper" htmlFor="ku-username">Username <span style={{ color: '#f87171' }}>*</span></label>
              <input
                id="ku-username" name="username" className={`input${fieldErrors.username && touched.username ? ' input--error' : ''}`}
                type="text" placeholder="e.g. AB1234" value={form.username}
                onChange={handleChange} onBlur={handleBlur} autoComplete="off" maxLength={100}
              />
              <FieldError message={touched.username ? fieldErrors.username : undefined} />
            </div>

            <div className="form-group">
              <label className="helper" htmlFor="ku-password">Password</label>
              <input
                id="ku-password" name="password" className="input"
                type="password" placeholder="AmoSave password" value={form.password}
                onChange={handleChange} autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label className="helper" htmlFor="ku-email">Email <span style={{ color: '#f87171' }}>*</span></label>
              <input
                id="ku-email" name="email" className={`input${fieldErrors.email && touched.email ? ' input--error' : ''}`}
                type="email" placeholder="user@example.com" value={form.email}
                onChange={handleChange} onBlur={handleBlur} autoComplete="off" maxLength={200}
              />
              <FieldError message={touched.email ? fieldErrors.email : undefined} />
            </div>

            <div className="form-group">
              <label className="helper" htmlFor="ku-apikey">Kite API Key <span style={{ color: '#f87171' }}>*</span></label>
              <input
                id="ku-apikey" name="kiteApiKey" className={`input${fieldErrors.kiteApiKey && touched.kiteApiKey ? ' input--error' : ''}`}
                type="text" placeholder="Kite API key" value={form.kiteApiKey}
                onChange={handleChange} onBlur={handleBlur} autoComplete="off" maxLength={50}
              />
              <FieldError message={touched.kiteApiKey ? fieldErrors.kiteApiKey : undefined} />
            </div>

            <div className="form-group">
              <label className="helper" htmlFor="ku-apisecret">Kite API Secret <span style={{ color: '#f87171' }}>*</span></label>
              <input
                id="ku-apisecret" name="kiteApiSecret" className={`input${fieldErrors.kiteApiSecret && touched.kiteApiSecret ? ' input--error' : ''}`}
                type="password" placeholder="Kite API secret" value={form.kiteApiSecret}
                onChange={handleChange} onBlur={handleBlur} autoComplete="new-password" maxLength={100}
              />
              <FieldError message={touched.kiteApiSecret ? fieldErrors.kiteApiSecret : undefined} />
            </div>

          </div>

          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-primary" type="submit" disabled={createMutation.isPending || hasErrors}>
              {createMutation.isPending ? 'Saving…' : '+ Add User'}
            </button>
            {apiError && <span style={{ color: '#f87171', fontSize: 13 }}>⚠ {apiError}</span>}
            {createMutation.isSuccess && <span style={{ color: '#35d18a', fontSize: 13 }}>✓ Credential saved.</span>}
          </div>
        </form>
      </div>

      {/* ── Connect Panel (inline) ── */}
      {connectState && (
        <div className="card" style={{ padding: '16px 24px', borderColor: 'rgba(99,102,241,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Connecting <strong style={{ color: 'var(--text)' }}>{connectState.username}</strong> — enter API secret to continue:
            </span>
            <input
              className="input" type="password" placeholder="Kite API secret"
              value={connectState.secret}
              onChange={(e) => setConnectState((s) => s ? { ...s, secret: e.target.value } : s)}
              style={{ flex: '1 1 220px', maxWidth: 300 }}
              autoFocus
            />
            <button className="btn btn-primary btn-sm" onClick={handleConnect} disabled={connectingId === connectState.credentialId}>
              {connectingId === connectState.credentialId ? 'Opening…' : 'Open Kite Login'}
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => { setConnectState(null); setConnectError(null); }}>
              Cancel
            </button>
          </div>
          {connectError && <div style={{ marginTop: 8, color: '#f87171', fontSize: 13 }}>⚠ {connectError}</div>}
        </div>
      )}

      {/* ── Credentials Table ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            Registered Kite Users
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>
              ({credentials.length})
            </span>
          </h2>
          <button className="btn btn-sm btn-ghost" onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.kiteCredentials })}>
            ↻ Refresh
          </button>
        </div>

        <AsyncState
          isLoading={credentialsQuery.isLoading}
          error={credentialsQuery.error ? mapHttpError(credentialsQuery.error) : null}
          isEmpty={credentials.length === 0}
          emptyText="No Kite users registered yet. Add one using the form above."
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>API Key</th>
                  <th>API Secret</th>
                  <th style={{ textAlign: 'center' }}>Active</th>
                  <th>Added At</th>
                  <th style={{ textAlign: 'center' }}>Connect</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((cred) => (
                  <tr key={cred.id} style={{ opacity: cred.isActive ? 1 : 0.5 }}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{cred.id}</td>
                    <td style={{ fontWeight: 600 }}>{cred.username}</td>
                    <td>{cred.email}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{cred.kiteApiKey}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{cred.kiteApiSecretMasked}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className={`btn btn-sm ${cred.isActive ? 'btn-success' : 'btn-ghost'}`}
                        style={{ minWidth: 64 }}
                        onClick={() => toggleActiveMutation.mutate({ id: cred.id, isActive: !cred.isActive })}
                        disabled={toggleActiveMutation.isPending}
                      >
                        {cred.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {new Date(cred.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => openConnectPanel(cred)}
                        disabled={connectingId === cred.id}
                      >
                        Connect
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteMutation.mutate(cred.id)}
                        disabled={deleteMutation.isPending}
                        title="Delete credential"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </div>
    </div>
  );
}
