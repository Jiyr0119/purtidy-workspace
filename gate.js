/* A convenience screen only. Public assets remain publicly accessible. */
(() => {
  const root = new URL('.', document.currentScript.src);
  const login = new URL('index.html', root);
  const key = 'purtidy-session-v1';
  function valid() { try { return Number(sessionStorage.getItem(key)) > Date.now(); } catch { return false; } }
  window.purtidyLogout = () => {sessionStorage.removeItem(key);location.replace(login.href);};
  if (!valid()) {
    const next = location.href;
    login.searchParams.set('next', next);
    location.replace(login.href);
  } else {
    document.documentElement.style.visibility = 'visible';
    addEventListener('pageshow',()=>{if(!valid()) location.replace(login.href);});
    setInterval(()=>{if(!valid()) location.replace(login.href);}, 30000);
  }
})();
