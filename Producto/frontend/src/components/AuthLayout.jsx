function AuthLayout({ children}) {
    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            {children}
        </div>
    );
}

export default AuthLayout;