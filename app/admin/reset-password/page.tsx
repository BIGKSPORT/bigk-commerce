'use client';

import {useEffect,useState,type FormEvent} from 'react';

export default function ResetPasswordPage() {
  const [token,setToken] = useState('');
  const [busy,setBusy] = useState(false);
  const [sent,setSent] = useState(false);
  const [finished,setFinished] = useState(false);
  const [error,setError] = useState('');

  useEffect(() => {
    setToken(location.hash.slice(1));
    if (location.hash) history.replaceState(null, '', location.pathname);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const password = fields.get('password');
    if (token && password !== fields.get('confirm')) {
      setError('De wachtwoorden komen niet overeen.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/password-reset', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(token
          ? {action: 'finish', token, password, code: fields.get('code')}
          : {action: 'request'}),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Wachtwoordherstel is niet gelukt.');
      if (token) {
        setFinished(true);
        setToken('');
      } else {
        setSent(true);
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <main className="page-container" style={{maxWidth: 620}} lang="nl">
    <h1>Wachtwoord herstellen</h1>
    {finished ? <p role="status">Je wachtwoord is gewijzigd. Log in met je nieuwe wachtwoord en een nieuwe authenticatorcode.</p>
      : sent ? <p role="status">De herstellink is verstuurd naar het eigenaarsadres van Big K. De link is 15 minuten geldig.</p>
      : <form className="panel" onSubmit={submit}>
        {token ? <>
          <label className="field">Nieuw wachtwoord
            <input name="password" type="password" autoComplete="new-password" minLength={16} maxLength={256} required/>
          </label>
          <label className="field">Herhaal je wachtwoord
            <input name="confirm" type="password" autoComplete="new-password" minLength={16} maxLength={256} required/>
          </label>
          <label className="field">Authenticator- of herstelcode
            <input name="code" autoComplete="one-time-code" maxLength={100} required/>
          </label>
        </> : <p>Ontvang een eenmalige link op het eigenaarsadres van Big K. Houd je authenticator of een herstelcode bij de hand.</p>}
        {error && <p role="alert" className="error-message">{error}</p>}
        <button className="button dark" disabled={busy}>{busy ? 'Even wachten…' : token ? 'Wachtwoord opslaan' : 'Stuur mij een herstellink'}</button>
      </form>}
    <p><a href="/admin">Terug naar inloggen</a></p>
  </main>;
}
