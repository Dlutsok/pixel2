import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Override the title
document.title = "Личный кабинет | Web Studio";

// Add meta tags for SEO
const meta = document.createElement('meta');
meta.name = 'description';
meta.content = 'Личный кабинет клиента веб-студии для отслеживания проектов, управления задачами и коммуникаций с командой разработки.';
document.head.appendChild(meta);

// Add Open Graph tags
const ogTitle = document.createElement('meta');
ogTitle.setAttribute('property', 'og:title');
ogTitle.content = 'Личный кабинет | Web Studio';
document.head.appendChild(ogTitle);

const ogDesc = document.createElement('meta');
ogDesc.setAttribute('property', 'og:description');
ogDesc.content = 'Отслеживайте статус разработки вашего сайта, взаимодействуйте с командой и управляйте задачами в едином личном кабинете.';
document.head.appendChild(ogDesc);

const ogType = document.createElement('meta');
ogType.setAttribute('property', 'og:type');
ogType.content = 'website';
document.head.appendChild(ogType);

// Add Inter and Poppins fonts
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@500;600;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

// Add Material Icons
const materialIcons = document.createElement('link');
materialIcons.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
materialIcons.rel = 'stylesheet';
document.head.appendChild(materialIcons);

createRoot(document.getElementById("root")!).render(<App />);
