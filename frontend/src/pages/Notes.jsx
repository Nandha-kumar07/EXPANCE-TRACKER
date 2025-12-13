import { useState, useEffect } from 'react';
import API from '../api';

export default function Notes() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentNote, setCurrentNote] = useState(null); // For editing
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        color: '#1e293b'
    });

    const COLORS = [
        '#1e293b', // Default Slate
        '#7f1d1d', // Red
        '#14532d', // Green
        '#1e3a8a', // Blue
        '#581c87', // Purple
        '#7c2d12', // Orange
    ];

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const res = await API.get('/notes');
            setNotes(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch notes", error);
            setLoading(false);
        }
    };

    const handleOpenModal = (note = null) => {
        if (note) {
            setCurrentNote(note);
            setFormData({
                title: note.title,
                content: note.content,
                color: note.color || '#1e293b'
            });
        } else {
            setCurrentNote(null);
            setFormData({ title: '', content: '', color: '#1e293b' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentNote(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (currentNote) {
                // Update
                const res = await API.put(`/notes/${currentNote._id}`, formData);
                setNotes(notes.map(n => n._id === currentNote._id ? res.data : n));
            } else {
                // Create
                const res = await API.post('/notes', formData);
                setNotes([res.data, ...notes]);
            }
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save note", error);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this note?")) return;
        try {
            await API.delete(`/notes/${id}`);
            setNotes(notes.filter(n => n._id !== id));
        } catch (error) {
            console.error("Failed to delete note", error);
        }
    };

    const handlePin = async (note, e) => {
        e.stopPropagation();
        try {
            const updated = { ...note, isPinned: !note.isPinned };
            const res = await API.put(`/notes/${note._id}`, { isPinned: updated.isPinned });
            // Optimistic update or refresh
            setNotes(prev => {
                const newNotes = prev.map(n => n._id === note._id ? res.data : n);
                return newNotes.sort((a, b) => b.isPinned - a.isPinned || new Date(b.updatedAt) - new Date(a.updatedAt));
            });
        } catch (error) {
            console.error("Failed to pin note", error);
        }
    };

    if (loading) return <div className="text-white">Loading notes...</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">My Notes</h1>
                    <p className="text-slate-400 mt-1">Capture ideas, reminders, and goals.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-primary-500/20"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    <span>New Note</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.map(note => (
                    <div
                        key={note._id}
                        onClick={() => handleOpenModal(note)}
                        style={{ backgroundColor: note.color }}
                        className={`relative p-6 rounded-2xl border border-white/5 cursor-pointer hover:scale-[1.02] transition-transform group duration-200 shadow-xl ${note.color === '#1e293b' ? 'bg-[#1e293b]' : ''} `}
                    >
                        {/* Pin Button */}
                        <button
                            onClick={(e) => handlePin(note, e)}
                            className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${note.isPinned ? 'bg-white/20 text-yellow-400' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            <svg className="w-4 h-4 transform rotate-45" fill={note.isPinned ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        </button>

                        <h3 className="text-xl font-bold text-white mb-3 pr-8 truncate">{note.title}</h3>
                        <p className="text-slate-300 text-sm line-clamp-4 whitespace-pre-wrap">{note.content}</p>

                        <div className="mt-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-slate-400 font-medium">{new Date(note.updatedAt).toLocaleString()}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleOpenModal(note); }}
                                    className="text-blue-400 hover:text-blue-300 p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button
                                    onClick={(e) => handleDelete(note._id, e)}
                                    className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {notes.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                        <svg className="w-12 h-12 mx-auto mb-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        <p>No notes yet. Create one to get started!</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div
                        className="w-full max-w-lg rounded-2xl shadow-2xl p-6 relative border border-white/10"
                        style={{ backgroundColor: formData.color }}
                    >
                        <button onClick={handleCloseModal} className="absolute top-4 right-4 text-white/50 hover:text-white">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">{currentNote ? 'Edit Note' : 'New Note'}</h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Title"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-white/10 border-none rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-0 text-lg font-bold"
                                    required
                                />
                            </div>
                            <div>
                                <textarea
                                    placeholder="Start typing..."
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full bg-white/5 border-none rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-0 min-h-[150px] resize-none"
                                    required
                                />
                            </div>

                            {/* Color Picker */}
                            <div className="flex gap-2 pt-2">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color: c })}
                                        className={`w-8 h-8 rounded-full border-2 ${formData.color === c ? 'border-white scale-110' : 'border-transparent hover:border-white/50'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-lg bg-white text-slate-900 hover:bg-slate-100 transition-colors font-bold shadow-lg"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
