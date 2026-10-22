import { useRef, useState } from "react";
import { Menu, X } from "lucide-react";

export default function NavigationMenu({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef(null);

  function closeMenu(event) {
    if (event.key === "Escape") {
      setIsOpen(false);
      toggleRef.current?.focus();
    }
  }

  return (
    <>
      <button ref={toggleRef} type="button" className="mobile-menu-toggle" aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={isOpen} aria-controls="primary-navigation-menu" onClick={() => setIsOpen(!isOpen)} onKeyDown={closeMenu}>
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <div id="primary-navigation-menu" className={`nav-links${isOpen ? " is-open" : ""}`} onKeyDown={closeMenu} onClick={(event) => {
        if (event.target.closest("a") || event.target.closest(".nav-button")) setIsOpen(false);
      }}>
        {children}
      </div>
    </>
  );
}
