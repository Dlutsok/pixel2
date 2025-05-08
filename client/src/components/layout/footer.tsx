import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-neutral-200 py-4 px-6 mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="text-sm text-neutral-500">
          &copy; {currentYear} Web Studio. Все права защищены.
        </div>
        <div className="flex space-x-4 mt-2 md:mt-0">
          <a href="/support" className="text-sm text-neutral-500 hover:text-primary transition">Поддержка</a>
          <a href="/support/knowledge" className="text-sm text-neutral-500 hover:text-primary transition">База знаний</a>
          <a href="/terms" className="text-sm text-neutral-500 hover:text-primary transition">Условия использования</a>
        </div>
      </div>
    </footer>
  );
}
