import { useState, useEffect } from 'react';
import { 
  Github, 
  Linkedin, 
  Mail, 
  ExternalLink, 
  Code2, 
  Layers, 
  Cpu, 
  ChevronRight,
  Database,
  Smartphone,
  Globe
} from 'lucide-react';
import { db } from './firebase';
import { ref, onValue } from 'firebase/database';

const ProjectCard = ({ project }) => (
  <div className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
    <div className="h-48 overflow-hidden bg-zinc-100 dark:bg-zinc-800 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
        <span className="text-white font-medium flex items-center gap-2">
          Ver Proyecto <ExternalLink size={16} />
        </span>
      </div>
      <div className="flex items-center justify-center h-full text-zinc-400 group-hover:scale-110 transition-transform duration-700">
        {project.icon === 'database' && <Database size={48} />}
        {project.icon === 'smartphone' && <Smartphone size={48} />}
        {project.icon === 'globe' && <Globe size={48} />}
      </div>
    </div>
    <div className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-semibold rounded-full uppercase tracking-wider">
          {project.tag}
        </span>
      </div>
      <h3 className="text-xl font-bold mb-2 dark:text-white group-hover:text-violet-600 transition-colors">
        {project.title}
      </h3>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6">
        {project.description}
      </p>
      <div className="flex flex-wrap gap-2">
        {project.tech.map((t, i) => (
          <span key={i} className="text-[10px] px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded font-mono">
            {t}
          </span>
        ))}
      </div>
    </div>
  </div>
);

function App() {
  const [projects, setProjects] = useState([
    {
      id: 1,
      title: "Avatar CRM",
      description: "Sistema de gestión de clientes en tiempo real con integración de Firebase y analíticas avanzadas para equipos de ventas.",
      tag: "Fullstack",
      icon: "database",
      tech: ["React", "Firebase", "Tailwind", "Chart.js"],
      link: "#"
    },
    {
      id: 2,
      title: "Native Payment Alerts",
      description: "Integración nativa para Android que permite recibir alertas de pago en tiempo real incluso en segundo plano mediante Capacitor.",
      tag: "Mobile",
      icon: "smartphone",
      tech: ["Capacitor", "Android", "JavaScript", "Push API"],
      link: "#"
    },
    {
      id: 3,
      title: "Global Price Tracker",
      description: "Plataforma de seguimiento de precios dinámicos con visualización de datos históricos y alertas personalizadas.",
      tag: "Web App",
      icon: "globe",
      tech: ["Vite", "Node.js", "MongoDB", "Framer Motion"],
      link: "#"
    }
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 selection:bg-violet-200 dark:selection:bg-violet-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tighter dark:text-white">
            JUAN<span className="text-violet-600">PAYO</span>
          </span>
          <div className="hidden md:flex gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#inicio" className="hover:text-violet-600 transition-colors">Inicio</a>
            <a href="#proyectos" className="hover:text-violet-600 transition-colors">Proyectos</a>
            <a href="#sobre-mi" className="hover:text-violet-600 transition-colors">Sobre mí</a>
            <a href="#contacto" className="hover:text-violet-600 transition-colors">Contacto</a>
          </div>
          <a href="#contacto" className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-2 rounded-full text-sm font-semibold hover:scale-105 transition-transform">
            ¡Hablemos!
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="inicio" className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 dark:text-white">
              Creando experiencias digitales <span className="text-violet-600 underline decoration-violet-500/30">impactantes</span>.
            </h1>
            <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed max-w-xl">
              Hola, soy Juan Payo. Desarrollador fullstack especializado en construir aplicaciones web y móviles escalables, rápidas y con un diseño impecable.
            </p>
            <div className="flex items-center gap-4">
              <a href="#proyectos" className="group bg-violet-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/20">
                Ver Proyectos <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </a>
              <div className="flex items-center gap-3">
                <a href="https://github.com" className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:text-violet-600 transition-colors">
                  <Github size={20} />
                </a>
                <a href="https://linkedin.com" className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:text-violet-600 transition-colors">
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <div className="relative w-64 h-64 md:w-96 md:h-96">
              <div className="absolute inset-0 bg-violet-600 rounded-[3rem] rotate-6 scale-95 opacity-20 animate-pulse"></div>
              <div className="absolute inset-0 bg-violet-400 rounded-[3rem] -rotate-3 scale-95 opacity-20"></div>
              <img 
                src="/profile.png" 
                alt="Juan Payo" 
                className="relative z-10 w-full h-full object-cover rounded-[3rem] grayscale hover:grayscale-0 transition-all duration-700 shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="proyectos" className="py-20 px-6 bg-white dark:bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 dark:text-white">Proyectos Destacados</h2>
              <p className="text-zinc-600 dark:text-zinc-400">Una selección de mis trabajos más recientes y desafiantes.</p>
            </div>
            <div className="flex gap-2">
              <span className="px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-sm font-bold">Todos</span>
              <span className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-sm font-bold cursor-pointer hover:bg-zinc-200 transition-colors">Mobile</span>
              <span className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-sm font-bold cursor-pointer hover:bg-zinc-200 transition-colors">Fullstack</span>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* Skills / Tech Stack Section */}
      <section className="py-20 px-6 grid md:grid-cols-4 gap-4 max-w-6xl mx-auto">
        <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4">
            <Code2 />
          </div>
          <h3 className="font-bold mb-2 dark:text-white">Frontend</h3>
          <p className="text-xs text-zinc-500">React, Next.js, Vue, TailwindCSS</p>
        </div>
        <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-4">
            <Layers />
          </div>
          <h3 className="font-bold mb-2 dark:text-white">Backend</h3>
          <p className="text-xs text-zinc-500">Node.js, Firebase, Supabase</p>
        </div>
        <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4">
            <Smartphone />
          </div>
          <h3 className="font-bold mb-2 dark:text-white">Mobile</h3>
          <p className="text-xs text-zinc-500">React Native, Capacitor</p>
        </div>
        <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center mb-4">
            <Cpu />
          </div>
          <h3 className="font-bold mb-2 dark:text-white">DevOps</h3>
          <p className="text-xs text-zinc-500">Docker, CI/CD, Git, Cloud</p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-20 px-6 bg-zinc-900 text-white rounded-t-[4rem]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">¿Tienes un proyecto en mente?</h2>
          <p className="text-zinc-400 text-lg mb-12">
            Siempre estoy buscando nuevos retos y colaboraciones interesantes en el mundo del desarrollo.
            ¡Escríbeme y hablemos de cómo podemos trabajar juntos!
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href="mailto:elpatiodesalcedo@gmail.com" className="flex items-center gap-3 bg-white text-zinc-900 px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform">
              <Mail size={20} /> elpatiodesalcedo@gmail.com
            </a>
            <div className="flex gap-4">
              <a href="#" className="p-4 bg-zinc-800 rounded-2xl hover:bg-zinc-700 transition-colors">
                <Github />
              </a>
              <a href="#" className="p-4 bg-zinc-800 rounded-2xl hover:bg-zinc-700 transition-colors">
                <Linkedin />
              </a>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-zinc-800 text-zinc-500 text-sm flex justify-between items-center">
            <p>© {new Date().getFullYear()} Juan Payo. Hecho con ❤️ y React.</p>
            <p>Diseño premium para mentes ambiciosas.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
