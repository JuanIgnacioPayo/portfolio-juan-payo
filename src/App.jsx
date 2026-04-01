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
  Globe,
  Settings,
  LogIn,
  Monitor
} from 'lucide-react';
import { db, auth, provider } from './firebase';
import { ref, onValue, set } from 'firebase/database';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import AdminPanel from './components/AdminPanel';
import EditableImage from './components/EditableImage';

const IconMap = {
  code2: Code2,
  layers: Layers,
  smartphone: Smartphone,
  cpu: Cpu,
  database: Database,
  globe: Globe,
  monitor: Monitor
};

const ColorMap = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
  violet: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400' }
};

const ProjectCard = ({ project, index, isAdmin, onUpdate }) => {
  const Icon = IconMap[project.icon] || Globe;
  return (
    <div className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col">
      <div className="h-48 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6 z-20 pointer-events-none">
          {!isAdmin && (
            <span className="text-white font-medium flex items-center gap-2">
              Ver Proyecto <ExternalLink size={16} />
            </span>
          )}
        </div>
        
        <div className="w-full h-full text-zinc-400 group-hover:scale-110 transition-transform duration-700">
          <EditableImage 
            src={project.image} 
            alt={project.title} 
            isAdmin={isAdmin}
            storagePath="projects"
            onUploadSuccess={(url) => onUpdate(`projects.${index}.image`, url)}
            className="w-full h-full"
          />
          {!project.image && !isAdmin && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon size={48} />
            </div>
          )}
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
          {project.tech?.map((t, i) => (
            <span key={i} className="text-[10px] px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded font-mono">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [user, setUser] = useState(null);
  const [content, setContent] = useState({
    nav: { logo: "JUAN PAYO" },
    hero: {
      title: "Creando experiencias digitales impactantes.",
      description: "Hola, soy Juan Payo. Desarrollador fullstack especializado en construir aplicaciones web y móviles escalables, rápidas y con un diseño impecable.",
      image: "/profile.png"
    },
    projects: [
      { id: 1, title: "Avatar CRM", description: "Sistema de gestión...", tag: "Fullstack", icon: "database", tech: ["React", "Firebase"], link: "#" }
    ],
    skills: [
      { id: 1, title: "Frontend", tech: "React, Next.js, Vue, TailwindCSS", icon: "code2", color: "blue" },
      { id: 2, title: "Backend", tech: "Node.js, Firebase, Supabase", icon: "layers", color: "amber" },
      { id: 3, title: "Mobile", tech: "React Native, Capacitor", icon: "smartphone", color: "emerald" },
      { id: 4, title: "DevOps", tech: "Docker, CI/CD, Git, Cloud", icon: "cpu", color: "rose" }
    ],
    contact: {
      title: "¿Tienes un proyecto en mente?",
      description: "Siempre estoy buscando nuevos retos y colaboraciones interesantes en el mundo del desarrollo.",
      email: "elpatiodesalcedo@gmail.com"
    },
    social: {
      github: "https://github.com",
      linkedin: "https://linkedin.com"
    }
  });

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setIsAdminMode(false);
    });

    const unsubContent = onValue(ref(db, 'content'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setContent(data);
      } else {
        set(ref(db, 'content'), content);
      }
    });

    return () => {
      unsubAuth();
      unsubContent();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const isOwner = user?.email === 'elpatiodesalcedo@gmail.com';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 selection:bg-violet-200 dark:selection:bg-violet-500/30 overflow-x-hidden">
      {isAdminMode && isOwner && (
        <AdminPanel 
          content={content} 
          onClose={() => setIsAdminMode(false)} 
        />
      )}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tighter dark:text-white uppercase">
            {content.nav?.logo || "JUAN PAYO"}
          </span>
          <div className="hidden md:flex gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#inicio" className="hover:text-violet-600 transition-colors">Inicio</a>
            <a href="#proyectos" className="hover:text-violet-600 transition-colors">Proyectos</a>
            <a href="#contacto" className="hover:text-violet-600 transition-colors">Contacto</a>
          </div>
          <div className="flex items-center gap-4">
            {isOwner && (
              <button 
                onClick={() => setIsAdminMode(true)}
                className="p-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full hover:rotate-90 transition-all duration-500"
              >
                <Settings size={20} />
              </button>
            )}
            <a href="#contacto" className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-2 rounded-full text-sm font-semibold hover:scale-105 transition-transform">
              ¡Hablemos!
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="inicio" className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 text-left">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 dark:text-white leading-[1.1]">
              {content.hero?.title}
            </h1>
            <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed max-w-xl">
              {content.hero?.description}
            </p>
            <div className="flex items-center gap-4">
              <a href="#proyectos" className="group bg-violet-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/20">
                Ver Proyectos <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </a>
              <div className="flex items-center gap-3">
                <a href={content.social?.github || "#"} target="_blank" className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:text-violet-600 transition-colors">
                  <Github size={20} />
                </a>
                <a href={content.social?.linkedin || "#"} target="_blank" className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:text-violet-600 transition-colors">
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <div className="relative w-64 h-64 md:w-96 md:h-96">
              <div className="absolute inset-0 bg-violet-600 rounded-[3rem] rotate-6 scale-95 opacity-20 animate-pulse"></div>
              <EditableImage 
                src={content.hero?.image} 
                alt="Juan Payo" 
                isAdmin={isAdminMode && isOwner}
                storagePath="profiles"
                onUploadSuccess={(url) => {
                  const updated = { ...content, hero: { ...content.hero, image: url } };
                  set(ref(db, 'content'), updated);
                }}
                className="relative z-10 w-full h-full object-cover rounded-[3rem] grayscale hover:grayscale-0 transition-all duration-700 shadow-2xl overflow-hidden"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="proyectos" className="py-20 px-6 bg-white dark:bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 text-left">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 dark:text-white">Proyectos Destacados</h2>
              <p className="text-zinc-600 dark:text-zinc-400">Una selección de mis trabajos más recientes.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.projects?.map((project, idx) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                index={idx}
                isAdmin={isAdminMode && isOwner}
                onUpdate={(path, val) => {
                  const updated = { ...content };
                  const keys = path.split('.');
                  let curr = updated;
                  for(let i=0; i < keys.length - 1; i++) curr = curr[keys[i]];
                  curr[keys[keys.length-1]] = val;
                  set(ref(db, 'content'), updated);
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-20 px-6 grid md:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {content.skills?.map((skill, idx) => {
          const Icon = IconMap[skill.icon] || Code2;
          const colors = ColorMap[skill.color] || ColorMap.violet;
          return (
            <div key={idx} className="p-8 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colors.bg} ${colors.text}`}>
                <Icon />
              </div>
              <h3 className="font-bold mb-2 dark:text-white">{skill.title}</h3>
              <p className="text-xs text-zinc-500">{skill.tech}</p>
            </div>
          );
        })}
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-20 px-6 bg-zinc-900 text-white rounded-t-[4rem]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">{content.contact?.title}</h2>
          <p className="text-zinc-400 text-lg mb-12">
            {content.contact?.description}
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href={`mailto:${content.contact?.email}`} className="flex items-center gap-3 bg-white text-zinc-900 px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform">
              <Mail size={20} /> {content.contact?.email}
            </a>
            {!user && (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 bg-zinc-800 text-zinc-400 px-6 py-4 rounded-2xl hover:bg-zinc-700 transition-all text-sm"
              >
                <LogIn size={18} /> Acceso Admin
              </button>
            )}
          </div>
          <div className="mt-20 pt-8 border-t border-zinc-800 text-zinc-500 text-sm flex justify-between items-center">
            <p>© {new Date().getFullYear()} {content.nav?.logo}. Hecho con ❤️ y React.</p>
            <p>Diseño premium para mentes ambiciosas.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
