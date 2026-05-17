function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <section className="auth-shell">
        <div className="auth-brand-panel">
          <div className="auth-deco deco-line-one"></div>
          <div className="auth-deco deco-line-two"></div>
          <div className="auth-deco deco-dots"></div>
          <div className="auth-deco deco-circle"></div>
          <div className="auth-deco deco-rings"></div>
          <div className="auth-blob"></div>

          <div className="auth-brand-content">
            <div className="brand-lightning">⚡</div>
            <h1>ServiElec Manager</h1>
            <div className="brand-separator"></div>
            <p>Sistema de gestión de servicios eléctricos</p>
          </div>
        </div>

        <div className="auth-form-panel">
          {children}
        </div>
      </section>
    </div>
  );
}

export default AuthLayout;