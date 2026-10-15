const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p>Website Vulnerability Scanner &copy; {YEAR}</p>
        <p className="muted small">
          Performs 15 non-intrusive checks. Only scan websites you own or have permission to test. This is not a
          substitute for a full penetration test.
        </p>
      </div>
    </footer>
  )
}
