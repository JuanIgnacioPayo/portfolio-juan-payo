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
  Monitor,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { db, auth, provider } from './firebase';
import { ref, onValue, set, push } from 'firebase/database';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6 z-10 pointer-events-none">
          {!isAdmin && (
            <span className="text-white font-medium flex items-center gap-2">
              Ver Proyecto <ExternalLink size={16} />
            </span>
          )}
        </div>

        <div className="w-full h-full text-zinc-400 relative z-20">
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

        {project.showPlayStore && project.playStoreUrl && (
          <a
            href={project.playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center gap-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 px-4 py-3 rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md w-full border border-zinc-800 dark:border-zinc-200"
          >
            <Smartphone size={16} /> Descargar en Play Store
          </a>
        )}
      </div>
    </div>
  );
};

const RotatingText = ({ texts }) => {
  const [index, setIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const currentTexts = (texts || []).filter(t => t && t.trim() !== "");
  if (currentTexts.length === 0) currentTexts.push("");

  useEffect(() => {
    if (currentTexts.length <= 1) return;

    const interval = setInterval(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % currentTexts.length);
        setIsExiting(false);
      }, 500); // Duración de la animación de salida
    }, 4000); // Cambiar cada 4 segundos

    return () => clearInterval(interval);
  }, [currentTexts]);

  return (
    <div className="relative h-8 overflow-hidden flex items-center justify-start min-w-[150px] md:min-w-[400px]">
      <span
        key={index}
        className={`absolute left-0 text-[10px] md:text-xl font-bold tracking-tighter dark:text-white uppercase whitespace-nowrap ${isExiting ? 'animate-slide-fade-out' : 'animate-slide-fade-in'
          }`}
      >
        {currentTexts[index]}
      </span>
    </div>
  );
};

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [user, setUser] = useState(null);
  const [formStatus, setFormStatus] = useState('idle'); // idle, loading, success, error
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [content, setContent] = useState({
    nav: { logo: "" },
    hero: {
      name: "",
      rotatingNames: null,
      title: "",
      description: "",
      image: "",
      avatar: ""
    },
    projects: [
      {
        id: 1,
        title: "",
        description: "",
        tag: "Fullstack",
        icon: "database",
        tech: ["React", "Firebase"],
        image: "https://res.cloudinary.com/dp6znoxry/image/upload/v1775077451/projects/fqhbccsefkzarmfgdqfs.png",
        link: "#"
      },
      {
        id: 2,
        title: "",
        description: "",
        tag: "Mobile",
        icon: "smartphone",
        tech: ["Android", "Kotlin"],
        image: "https://res.cloudinary.com/dp6znoxry/image/upload/v1775077330/projects/era8gk5jmh8r3drpsypm.png",
        link: "#"
      },
      {
        id: 3,
        title: "",
        description: "",
        tag: "Web App",
        icon: "globe",
        tech: ["HTML", "CMS"],
        image: "https://res.cloudinary.com/dp6znoxry/image/upload/v1775077692/projects/ez1datebws2u7ujhnkei.png",
        link: "#"
      }
    ],
    skills: [
      { id: 1, title: "Frontend", tech: "React, Next.js, Vue, TailwindCSS", icon: "code2", color: "blue" },
      { id: 2, title: "Backend", tech: "Node.js, Firebase", icon: "layers", color: "amber" },
      { id: 3, title: "Mobile", tech: "React Native, Capacitor, Kotlin", icon: "smartphone", color: "emerald" },
      { id: 4, title: "DevOps", tech: "Docker, CI/CD, Git, Cloud", icon: "cpu", color: "rose" }
    ],
    contact: {
      title: "¿Tienes un proyecto en mente?",
      description: "Siempre estoy buscando nuevos retos y colaboraciones interesantes en el mundo del desarrollo.",
      email: "",
      showEmailInfo: false,
      formspreeId: "mzdkawbd"
    },
    social: {
      github: "https://github.com/",
      linkedin: "https://linkedin.com/"
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
        // Merge data with defaults to ensure missing sections (like 'contact') don't break the app
        setContent(prev => ({
          ...prev,
          ...data,
          nav: { ...prev.nav, ...data.nav },
          hero: { ...prev.hero, ...data.hero },
          contact: { ...prev.contact, ...data.contact },
          social: { ...prev.social, ...data.social }
        }));
      } else {
        set(ref(db, 'content'), content);
      }
    });

    return () => {
      unsubAuth();
      unsubContent();
    };
  }, []);

  // Lock scroll when Admin Panel is open
  useEffect(() => {
    if (isAdminMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isAdminMode]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('loading');

    try {
      // 1. Save to Firebase backup
      const messagesRef = ref(db, 'messages');
      const newMessageRef = push(messagesRef);
      await set(newMessageRef, {
        ...formData,
        timestamp: Date.now(),
        read: false
      });

      // 2. Submit to Formspree for Email Notifications
      if (content.contact?.formspreeId) {
        await fetch(`https://formspree.io/f/${content.contact.formspreeId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }

      setFormStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setFormStatus('idle'), 5000);
    } catch (error) {
      console.error("Submission failed:", error);
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 5000);
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
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex-1 flex justify-start overflow-hidden">
            <RotatingText texts={
              content.hero?.rotatingNames
                ? [content.hero.rotatingNames[0] || content.hero.name, ...(content.hero.rotatingNames.slice(1))]
                : [content.hero?.name || content.nav?.logo || ""]
            } />
          </div>

          <div className="hidden md:flex flex-1 justify-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#inicio" className="hover:text-violet-600 transition-colors">Inicio</a>
            <a href="#proyectos" className="hover:text-violet-600 transition-colors">Proyectos</a>
            <a href="#contacto" className="hover:text-violet-600 transition-colors">Contacto</a>
          </div>

          <div className="flex-1 flex items-center justify-end gap-2 md:gap-3">
            {isOwner && (
              <button
                onClick={() => setIsAdminMode(true)}
                title="Configuración"
                className="p-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full hover:rotate-90 transition-all duration-500"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}

            {user ? (
              <button
                onClick={handleLogout}
                title="Cerrar Sesión"
                className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full hover:text-rose-500 transition-colors"
              >
                <LogIn className="w-4 h-4 md:w-5 md:h-5 rotate-180" />
              </button>
            ) : (
              <button
                onClick={handleLogin}
                title="Acceso Admin"
                className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full hover:text-violet-600 transition-colors"
              >
                <LogIn className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}

            <a href="#contacto" className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-3 md:px-5 py-2 rounded-full text-xs md:text-sm font-semibold hover:scale-105 transition-transform whitespace-nowrap">
              <span className="md:hidden">¡Chat!</span>
              <span className="hidden md:inline">¡Hablemos!</span>
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
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-10 group/avatar">
              <div className="shrink-0 w-20 h-20 md:w-24 md:h-24 relative">
                <div className="absolute inset-0 bg-violet-600 rounded-full scale-110 opacity-20 blur-md group-hover/avatar:opacity-40 transition-opacity"></div>
                <EditableImage
                  src={content.hero?.avatar}
                  alt={content.hero?.name || ""}
                  isAdmin={isOwner}
                  storagePath="profiles"
                  onUploadSuccess={(url) => {
                    const updated = { ...content, hero: { ...content.hero, avatar: url } };
                    set(ref(db, 'content'), updated);
                  }}
                  className="relative z-10 w-full h-full object-cover rounded-full border-4 border-white dark:border-zinc-900 shadow-xl overflow-hidden"
                />
              </div>
              <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                {content.hero?.description}
              </p>
            </div>
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
                alt={content.hero?.name || ""}
                isAdmin={isOwner}
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
                isAdmin={isOwner}
                onUpdate={(path, val) => {
                  const updated = { ...content };
                  const keys = path.split('.');
                  let curr = updated;
                  for (let i = 0; i < keys.length - 1; i++) curr = curr[keys[i]];
                  curr[keys[keys.length - 1]] = val;
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">{content.contact?.title}</h2>
            <p className="text-zinc-400 text-lg">
              {content.contact?.description}
            </p>
          </div>

          <div className={`grid ${content.contact?.showEmailInfo !== false ? 'md:grid-cols-2' : 'max-w-2xl mx-auto'} gap-12 items-start`}>
            {content.contact?.showEmailInfo !== false && (
              <div className="space-y-8">
                <div className="bg-zinc-800/50 p-8 rounded-3xl border border-zinc-700/50">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Mail className="text-violet-500" /> Información de contacto
                  </h3>
                  <div className="space-y-4">
                    <p className="text-zinc-400 text-sm">¿Prefieres enviar un correo directo?</p>
                    <a href={`mailto:${content.contact?.email}`} className="text-lg font-semibold hover:text-violet-400 transition-colors block">
                      {content.contact?.email}
                    </a>
                  </div>
                </div>

                {!user && (
                  <div className="flex justify-center md:justify-start">
                    <button
                      onClick={handleLogin}
                      className="flex items-center gap-2 bg-zinc-800 text-zinc-400 px-6 py-4 rounded-2xl hover:bg-zinc-700 transition-all text-sm"
                    >
                      <LogIn size={18} /> Acceso Admin
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className={`space-y-4 bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl ${content.contact?.showEmailInfo === false ? 'w-full' : ''}`}>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2 ml-1">Nombre Completo</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-violet-500 transition-all text-zinc-900 dark:text-white"
                  placeholder="Tu nombre..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2 ml-1">Correo Electrónico</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-violet-500 transition-all text-zinc-900 dark:text-white"
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2 ml-1">Tu Consulta</label>
                <textarea
                  required
                  rows="4"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-violet-500 transition-all text-zinc-900 dark:text-white resize-none"
                  placeholder="Cuéntame sobre tu proyecto..."
                />
              </div>

              <button
                type="submit"
                disabled={formStatus === 'loading'}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${formStatus === 'success' ? 'bg-emerald-500 text-white' :
                  formStatus === 'error' ? 'bg-rose-500 text-white' :
                    'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-500/20'
                  }`}
              >
                {formStatus === 'loading' ? <Loader2 className="animate-spin" /> :
                  formStatus === 'success' ? <CheckCircle2 /> :
                    formStatus === 'error' ? 'Error' : 'Enviar Mensaje'}
                {formStatus === 'success' ? '¡Enviado!' : formStatus === 'idle' ? <ChevronRight size={18} /> : ''}
              </button>
            </form>
          </div>
          <div className="mt-20 pt-8 border-t border-zinc-800 text-zinc-500 text-sm flex justify-between items-center">
            <p>© {new Date().getFullYear()} Juan Payo. Hecho con React.</p>
            <p>Diseños premium para gente pragmática.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
