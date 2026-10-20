import { FiChevronLeft } from "react-icons/fi";
import "./ManagementBackBar.css";
export default function ManagementBackBar({ children, onClick }) {
  return (
    <nav className="management-back-bar" aria-label="Back navigation">
      <button type="button" onClick={onClick}>
        <FiChevronLeft aria-hidden="true" />
        {children}
      </button>
    </nav>
  );
}
