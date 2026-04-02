import { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  LogOut, 
  Loader2,
  CheckCircle2,
  Layout,
  Briefcase,
  Layers,
  MessageSquare,
  Globe,
  Smartphone,
  Database,
  Code2,
  Cpu,
  Monitor,
  Mail
} from 'lucide-react';
import { db, auth } from '../firebase';
import { ref, set, onValue, remove } from 'firebase/database';
import { signOut } from 'firebase/auth';

const iconOptions = [
  { val: 'globe', label: 'Globo' },
  { val: 'smartphone', label: 'Móvil' },
  { val: 'database', label: 'Base de Datos' },
  { val: 'code2', label: 'Código' },
  { val: 'cpu', label: 'CPU' },
  { val: 'layers', label: 'Capas' },
  { val: 'monitor', label: 'Pantalla' }
];

const AdminPanel = ({ content, onClose }) => {
  const [activeTab, setActiveTab] = useState('hero');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  useEffect(() => {
    const messagesRef = ref(db, 'messages');
    const unsub = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({
          id,
          ...val
        })).sort((a, b) => b.timestamp - a.timestamp);
        setMessages(list);
      } else {
        setMessages([]);
      }
    });

    return () => unsub();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await set(ref(db, 'content'), localContent);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Error saving content:", err);
      alert("Error al guardar: " + err.message);
    }
    setLoading(false);
  };

  const updateField = (path, value) => {
    const keys = path.split('.');
    const updated = JSON.parse(JSON.stringify(localContent)); // Deep clone
    let current = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {}; // Create missing segments
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setLocalContent(updated);
  };

  const updateNestedList = (listKey, index, field, value) => {
    const updatedList = [...(localContent[listKey] || [])];
    if (updatedList[index]) {
      updatedList[index] = { ...updatedList[index], [field]: value };
      setLocalContent(prev => ({ ...prev, [listKey]: updatedList }));
    }
  };

  const addItem = (listKey, template) => {
    setLocalContent(prev => {
      const currentList = prev[listKey] || [];
      const templateItem = listKey === 'projects' 
        ? { ...template, showPlayStore: false, playStoreUrl: "" } 
        : template;
      return {
        ...prev,
        [listKey]: [...currentList, { ...templateItem, id: Date.now() }]
      };
    });
  };

  const removeItem = (listKey, index) => {
    const currentList = localContent[listKey] || [];
    const updatedList = currentList.filter((_, i) => i !== index);
    setLocalContent(prev => ({ ...prev, [listKey]: updatedList }));
  };

  const deleteMessage = async (e, id) => {
    e.stopPropagation(); // Evitar que el clic afecte al panel de fondo
    if (!window.confirm("¿Estás seguro de que quieres eliminar este mensaje?")) return;
    try {
      await remove(ref(db, `messages/${id}`));
    } catch (err) {
      alert("Error al eliminar mensaje: " + err.message);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-xl bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-zinc-200 dark:border-zinc-800 overscroll-contain">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold dark:text-white uppercase tracking-tighter">Admin Panel</h2>
            <p className="text-xs text-zinc-500">Editando sección: {activeTab.toUpperCase()}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-violet-700 disabled:opacity-50 transition-all text-sm shadow-lg shadow-violet-500/20"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
              {saved ? "Guardado" : "Guardar Cambios"}
            </button>
            <button onClick={onClose} className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl dark:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-x-auto no-scrollbar">
          {[
            { id: 'hero', icon: Layout, label: 'Hero' },
            { id: 'projects', icon: Briefcase, label: 'Proyectos' },
            { id: 'skills', icon: Layers, label: 'Skills' },
            { id: 'contact', icon: MessageSquare, label: 'Contacto' },
            { id: 'messages', icon: Mail, label: 'Mensajes' },
            { id: 'site', icon: Globe, label: 'Sitio' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-violet-600 text-violet-600 bg-white dark:bg-zinc-900' : 'border-transparent text-zinc-500'}`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-10 pb-32">
          {activeTab === 'hero' && (
            <div className="space-y-6">
              <div className="group">
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Nombre / Frase 1 (Ej: Juan Payo)</label>
                <input type="text" value={localContent.hero?.rotatingNames?.[0] || localContent.hero?.name} onChange={(e) => {
                  const current = [...(localContent.hero?.rotatingNames || [localContent.hero?.name, "", ""])];
                  current[0] = e.target.value;
                  updateField('hero.rotatingNames', current);
                  updateField('hero.name', e.target.value);
                }} className="w-full p-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-violet-500 transition-all dark:text-white font-bold" />
              </div>
              <div className="group">
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Frase de Rotación 2</label>
                <input type="text" value={localContent.hero?.rotatingNames?.[1] || ""} onChange={(e) => {
                  const current = [...(localContent.hero?.rotatingNames || [localContent.hero?.name, "", ""])];
                  current[1] = e.target.value;
                  updateField('hero.rotatingNames', current);
                }} className="w-full p-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-violet-500 transition-all dark:text-white font-medium" />
              </div>
              <div className="group">
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Frase de Rotación 3</label>
                <input type="text" value={localContent.hero?.rotatingNames?.[2] || ""} onChange={(e) => {
                  const current = [...(localContent.hero?.rotatingNames || [localContent.hero?.name, "", ""])];
                  current[2] = e.target.value;
                  updateField('hero.rotatingNames', current);
                }} className="w-full p-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-violet-500 transition-all dark:text-white font-medium" />
              </div>
              <div className="group">
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Título Hero</label>
                <input type="text" value={localContent.hero?.title} onChange={(e) => updateField('hero.title', e.target.value)} className="w-full p-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-violet-500 transition-all dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Biografía (Intro)</label>
                <textarea rows="4" value={localContent.hero?.description} onChange={(e) => updateField('hero.description', e.target.value)} className="w-full p-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-violet-500 transition-all dark:text-white resize-none" />
              </div>
              <div className="bg-violet-50 dark:bg-violet-950/20 p-4 rounded-2xl border border-violet-100 dark:border-violet-900/30">
                <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">
                  📸 <b>Tip:</b> Puedes cambiar tanto la foto principal como la circular directamente haciendo clic sobre ellas en la web.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-8">
              <button 
                onClick={() => addItem('projects', { title: "Nuevo Proyecto", description: "...", tag: "Web App", icon: "globe", tech: ["React"], image: "", link: "#" })} 
                className="w-full py-5 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-400 font-bold hover:border-violet-500 hover:text-violet-500 transition-all flex items-center justify-center gap-2 group"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Añadir Nuevo Proyecto
              </button>
              {localContent.projects?.map((proj, idx) => (
                <div key={idx} className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] relative group border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                       <label className="text-[10px] font-bold text-zinc-400 uppercase">Título</label>
                       <input type="text" value={proj.title} onChange={(e) => updateNestedList('projects', idx, 'title', e.target.value)} className="w-full font-bold bg-transparent dark:text-white border-none p-1 focus:ring-0" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Descripción</label>
                      <textarea rows="2" value={proj.description} onChange={(e) => updateNestedList('projects', idx, 'description', e.target.value)} className="text-sm bg-transparent w-full text-zinc-500 border-none p-1 focus:ring-0 resize-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Tag</label>
                      <input type="text" value={proj.tag} onChange={(e) => updateNestedList('projects', idx, 'tag', e.target.value)} className="text-xs bg-white dark:bg-zinc-900 px-3 py-2 rounded-xl w-full" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Icono</label>
                      <select value={proj.icon} onChange={(e) => updateNestedList('projects', idx, 'icon', e.target.value)} className="text-xs bg-white dark:bg-zinc-900 px-3 py-2 rounded-xl w-full">
                        {iconOptions.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2 space-y-4 pt-2 border-t border-zinc-200 dark:border-zinc-700/50">
                      <div className="flex items-center justify-between">
                         <div>
                           <label className="text-[10px] font-bold text-zinc-400 uppercase">Mostrar Play Store</label>
                           <p className="text-[10px] text-zinc-500">Añade un botón de descarga a este proyecto.</p>
                         </div>
                         <button 
                           onClick={() => updateNestedList('projects', idx, 'showPlayStore', !proj.showPlayStore)}
                           className={`w-10 h-5 rounded-full transition-all relative ${proj.showPlayStore ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                         >
                           <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${proj.showPlayStore ? 'right-0.5' : 'left-0.5'}`}></div>
                         </button>
                      </div>
                      
                      {proj.showPlayStore && (
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase">Play Store URL</label>
                          <input 
                            type="text" 
                            placeholder="https://play.google.com/store/apps/details?id=..."
                            value={proj.playStoreUrl || ""} 
                            onChange={(e) => updateNestedList('projects', idx, 'playStoreUrl', e.target.value)} 
                            className="w-full text-xs bg-white dark:bg-zinc-950 p-3 rounded-xl mt-1 border border-zinc-100 dark:border-zinc-800 focus:ring-1 focus:ring-violet-500 outline-none" 
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="col-span-2 bg-zinc-100 dark:bg-zinc-950/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <p className="text-[10px] text-zinc-500">
                        Hacer clic en la casilla del proyecto en la web para subir una imagen.
                      </p>
                    </div>
                  </div>
                  <button onClick={() => removeItem('projects', idx)} className="absolute top-4 right-4 text-rose-500 p-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-6">
              {localContent.skills?.map((skill, idx) => (
                <div key={idx} className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Título Categoría</label>
                      <input type="text" value={skill.title} onChange={(e) => updateNestedList('skills', idx, 'title', e.target.value)} className="w-full bg-transparent font-bold dark:text-white" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Color Base</label>
                      <select value={skill.color} onChange={(e) => updateNestedList('skills', idx, 'color', e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 text-xs p-2 rounded-xl">
                        <option value="blue">Azul Ártico</option>
                        <option value="amber">Ámbar Cálido</option>
                        <option value="emerald">Esmeralda Pro</option>
                        <option value="rose">Rosa Eléctrico</option>
                        <option value="violet">Violeta Neon</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Icono</label>
                      <select value={skill.icon} onChange={(e) => updateNestedList('skills', idx, 'icon', e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 text-xs p-2 rounded-xl">
                        {iconOptions.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Stack (Párrafo corto)</label>
                    <input type="text" value={skill.tech} onChange={(e) => updateNestedList('skills', idx, 'tech', e.target.value)} className="w-full text-xs text-zinc-500 bg-transparent" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-8">
              <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-700 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold dark:text-white">Información de Contacto Directo</h4>
                  <p className="text-[10px] text-zinc-500">Muestra u oculta la caja con tu email en la web.</p>
                </div>
                <button 
                  onClick={() => updateField('contact.showEmailInfo', localContent.contact?.showEmailInfo === false ? true : false)}
                  className={`w-12 h-6 rounded-full transition-all relative ${localContent.contact?.showEmailInfo !== false ? 'bg-violet-600' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localContent.contact?.showEmailInfo !== false ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Título Contacto</label>
                <input type="text" value={localContent.contact?.title} onChange={(e) => updateField('contact.title', e.target.value)} className="w-full p-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl dark:text-white text-xl font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Email de Contacto</label>
                <input type="email" value={localContent.contact?.email} onChange={(e) => updateField('contact.email', e.target.value)} className="w-full p-4 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Bajada / Descripción Footer</label>
                <textarea rows="3" value={localContent.contact?.description} onChange={(e) => updateField('contact.description', e.target.value)} className="w-full p-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl dark:text-white resize-none" />
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Bandeja de Entrada ({messages.length})</h3>
              </div>
              
              {messages.length === 0 ? (
                <div className="py-20 text-center bg-zinc-50 dark:bg-zinc-800/30 rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                  <Mail className="mx-auto text-zinc-300 mb-4" size={48} />
                  <p className="text-zinc-500 font-medium">No hay mensajes todavía.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="p-6 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 rounded-3xl shadow-sm relative group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold dark:text-white text-lg">{msg.name}</p>
                        <p className="text-xs text-violet-600 dark:text-violet-400 font-mono">{msg.email}</p>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-medium">
                        {new Date(msg.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border border-zinc-100 dark:border-zinc-800 italic">
                      "{msg.message}"
                    </div>
                    <button 
                      onClick={(e) => deleteMessage(e, msg.id)}
                      className="absolute top-4 right-4 text-rose-500 p-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'site' && (
            <div className="space-y-8">
              <div className="p-6 bg-violet-50 dark:bg-violet-950/20 rounded-3xl border border-violet-100 dark:border-violet-900/30">
                <label className="text-[10px] font-bold text-violet-600 uppercase mb-2 block tracking-widest">Identidad Visual</label>
                <div className="flex items-center gap-4">
                   <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 text-sm font-bold uppercase tracking-tighter">
                     {localContent.nav?.logo}
                   </div>
                   <input type="text" value={localContent.nav?.logo} onChange={(e) => updateField('nav.logo', e.target.value)} className="flex-1 p-4 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl dark:text-white font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">GitHub</label>
                  <input type="text" value={localContent.social?.github} onChange={(e) => updateField('social.github', e.target.value)} className="w-full p-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl text-xs dark:text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">LinkedIn</label>
                  <input type="text" value={localContent.social?.linkedin} onChange={(e) => updateField('social.linkedin', e.target.value)} className="w-full p-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl text-xs dark:text-white" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30 flex justify-between items-center">
          <p className="text-[10px] text-zinc-500 font-medium">Logged in: <b>{auth.currentUser?.email}</b></p>
          <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/20 px-4 py-2.5 rounded-xl transition-all text-xs border border-rose-100 dark:border-rose-900/30">
            <LogOut size={14} /> Desconectarse
          </button>
        </div>
      </div>
  );
};

export default AdminPanel;
