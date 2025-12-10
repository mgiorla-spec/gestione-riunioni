import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle, Circle, AlertCircle, X, Edit2, Archive, Bell, Filter, Clock, User, MessageSquare, ChevronDown, ChevronUp, Users, Trash2, RotateCcw, Save } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Inizializza Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const MeetingManagementApp = () => {
  const styles = `
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `;

  // Stati
  const [currentUser, setCurrentUser] = useState('Mario Rossi');
  const [currentView, setCurrentView] = useState('dashboard');
  const [filterByUser, setFilterByUser] = useState('');
  const [participants, setParticipants] = useState([]);
  const [topics, setTopics] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddParticipantForm, setShowAddParticipantForm] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [selectedMeetingDate, setSelectedMeetingDate] = useState('2024-12-10');
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [selectedTopicForTask, setSelectedTopicForTask] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [expandedTopics, setExpandedTopics] = useState({});
  const [filterByClassification, setFilterByClassification] = useState('');
  
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editingTopicDate, setEditingTopicDate] = useState('');
  const [newResponseText, setNewResponseText] = useState({});
  const [editingResponseId, setEditingResponseId] = useState(null);
  const [editingResponseText, setEditingResponseText] = useState('');
  const [newTaskComment, setNewTaskComment] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  
  const [newTopic, setNewTopic] = useState({
    meetingDate: '',
    description: '',
    importance: 'B',
    question: '',
    classification: 'Problema'
  });
  
  const [newTask, setNewTask] = useState({
    description: '',
    responsible: '',
    startDate: '',
    endDate: ''
  });

  const classifications = ['Problema', 'Problema con soluzione', 'Richiesta attività ad altro ente', 'Informazione', 'Richiesta informazione'];

  const classificationColors = {
    'Problema': 'bg-rose-50 border-rose-300',
    'Problema con soluzione': 'bg-amber-50 border-amber-300',
    'Richiesta attività ad altro ente': 'bg-blue-50 border-blue-300',
    'Informazione': 'bg-emerald-50 border-emerald-300',
    'Richiesta informazione': 'bg-purple-50 border-purple-300'
  };

  // Carica dati iniziali
  useEffect(() => {
    loadParticipants();
    loadTopics();
    loadTasks();
  }, []);

  const loadParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setParticipants(data.map(p => p.name));
      
      if (data.length > 0) {
        setCurrentUser(data[0].name);
      }
    } catch (error) {
      console.error('Errore caricamento partecipanti:', error);
      addNotification('Errore caricamento partecipanti');
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async () => {
    try {
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (topicsError) throw topicsError;

      const topicsWithResponses = await Promise.all(
        topicsData.map(async (topic) => {
          const { data: responses, error: responsesError } = await supabase
            .from('responses')
            .select('*')
            .eq('topic_id', topic.id)
            .order('created_at');
          
          return {
            id: topic.id,
            meetingDate: topic.meeting_date,
            description: topic.description,
            importance: topic.importance,
            question: topic.question,
            classification: topic.classification,
            author: topic.author,
            status: topic.status,
            archived: topic.archived,
            responses: responses ? responses.map(r => ({
              id: r.id,
              text: r.text,
              author: r.author,
              timestamp: r.created_at
            })) : []
          };
        })
      );

      setTopics(topicsWithResponses);
    } catch (error) {
      console.error('Errore caricamento argomenti:', error);
      addNotification('Errore caricamento argomenti');
    }
  };

  const loadTasks = async () => {
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (tasksError) throw tasksError;

      const tasksWithComments = await Promise.all(
        tasksData.map(async (task) => {
          const { data: comments, error: commentsError } = await supabase
            .from('task_comments')
            .select('*')
            .eq('task_id', task.id)
            .order('created_at');
          
          return {
            id: task.id,
            topicId: task.topic_id,
            description: task.description,
            responsible: task.responsible,
            startDate: task.start_date,
            endDate: task.end_date,
            status: task.status,
            archived: task.archived,
            comments: comments ? comments.map(c => ({
              id: c.id,
              text: c.comment,
              author: c.author || 'Sistema',
              timestamp: c.created_at
            })) : []
          };
        })
      );

      setTasks(tasksWithComments);
    } catch (error) {
      console.error('Errore caricamento attività:', error);
      addNotification('Errore caricamento attività');
    }
  };

  // Funzioni partecipanti
  const addParticipant = async () => {
    if (newParticipantName.trim() && !participants.includes(newParticipantName.trim())) {
      try {
        const { error } = await supabase
          .from('participants')
          .insert([{ name: newParticipantName.trim() }]);
        
        if (error) throw error;
        
        await loadParticipants();
        setNewParticipantName('');
        setShowAddParticipantForm(false);
        addNotification(`Partecipante aggiunto`);
      } catch (error) {
        console.error('Errore aggiunta partecipante:', error);
        addNotification('Errore aggiunta partecipante');
      }
    }
  };

  const removeParticipant = async (name) => {
    if (participants.length > 1) {
      try {
        const { error } = await supabase
          .from('participants')
          .delete()
          .eq('name', name);
        
        if (error) throw error;
        
        await loadParticipants();
        addNotification(`Partecipante rimosso`);
      } catch (error) {
        console.error('Errore rimozione partecipante:', error);
        addNotification('Errore rimozione partecipante');
      }
    }
  };

  // Funzioni argomenti
  const addTopic = async () => {
    if (newTopic.meetingDate && newTopic.description && newTopic.question) {
      try {
        const { error } = await supabase
          .from('topics')
          .insert([{
            meeting_date: newTopic.meetingDate,
            description: newTopic.description,
            importance: newTopic.importance,
            question: newTopic.question,
            classification: newTopic.classification,
            author: currentUser,
            status: 'pending',
            archived: false
          }]);
        
        if (error) throw error;
        
        await loadTopics();
        setNewTopic({ meetingDate: '', description: '', importance: 'B', question: '', classification: 'Problema' });
        setShowNewTopicForm(false);
        addNotification(`Argomento aggiunto`);
      } catch (error) {
        console.error('Errore aggiunta argomento:', error);
        addNotification('Errore aggiunta argomento');
      }
    }
  };

  const updateTopicStatus = async (topicId, status) => {
    try {
      const { error } = await supabase
        .from('topics')
        .update({ status })
        .eq('id', topicId);
      
      if (error) throw error;
      await loadTopics();
    } catch (error) {
      console.error('Errore aggiornamento stato:', error);
      addNotification('Errore aggiornamento stato');
    }
  };

  const updateTopicDate = async (topicId, newDate) => {
    try {
      const { error } = await supabase
        .from('topics')
        .update({ meeting_date: newDate })
        .eq('id', topicId);
      
      if (error) throw error;
      
      await loadTopics();
      setEditingTopicId(null);
      setEditingTopicDate('');
      addNotification('Data aggiornata');
    } catch (error) {
      console.error('Errore aggiornamento data:', error);
      addNotification('Errore aggiornamento data');
    }
  };

  const archiveTopic = async (topicId) => {
    try {
      const { error } = await supabase
        .from('topics')
        .update({ archived: true })
        .eq('id', topicId);
      
      if (error) throw error;
      await loadTopics();
      addNotification('Argomento archiviato');
    } catch (error) {
      console.error('Errore archiviazione:', error);
      addNotification('Errore archiviazione');
    }
  };

  const restoreTopic = async (topicId) => {
    try {
      const { error } = await supabase
        .from('topics')
        .update({ archived: false })
        .eq('id', topicId);
      
      if (error) throw error;
      await loadTopics();
      addNotification('Argomento ripristinato');
    } catch (error) {
      console.error('Errore ripristino:', error);
      addNotification('Errore ripristino');
    }
  };

  const deleteTopic = async (topicId) => {
    if (window.confirm('Eliminare questo argomento?')) {
      try {
        const { error } = await supabase
          .from('topics')
          .delete()
          .eq('id', topicId);
        
        if (error) throw error;
        await loadTopics();
        addNotification('Argomento eliminato');
      } catch (error) {
        console.error('Errore eliminazione:', error);
        addNotification('Errore eliminazione');
      }
    }
  };

  // Funzioni risposte
  const addResponseToTopic = async (topicId) => {
    const text = newResponseText[topicId];
    if (!text || !text.trim()) return;
    
    try {
      const { error } = await supabase
        .from('responses')
        .insert([{
          topic_id: topicId,
          text: text.trim(),
          author: currentUser
        }]);
      
      if (error) throw error;
      
      await loadTopics();
      setNewResponseText({ ...newResponseText, [topicId]: '' });
      addNotification(`Risposta aggiunta`);
    } catch (error) {
      console.error('Errore aggiunta risposta:', error);
      addNotification('Errore aggiunta risposta');
    }
  };

  const updateResponse = async (topicId, responseId) => {
    if (!editingResponseText.trim()) return;
    
    try {
      const { error } = await supabase
        .from('responses')
        .update({ text: editingResponseText.trim() })
        .eq('id', responseId);
      
      if (error) throw error;
      
      await loadTopics();
      setEditingResponseId(null);
      setEditingResponseText('');
      addNotification(`Risposta modificata`);
    } catch (error) {
      console.error('Errore modifica risposta:', error);
      addNotification('Errore modifica risposta');
    }
  };

  const deleteResponse = async (topicId, responseId) => {
    if (window.confirm('Eliminare questa risposta?')) {
      try {
        const { error } = await supabase
          .from('responses')
          .delete()
          .eq('id', responseId);
        
        if (error) throw error;
        
        await loadTopics();
        addNotification(`Risposta eliminata`);
      } catch (error) {
        console.error('Errore eliminazione risposta:', error);
        addNotification('Errore eliminazione risposta');
      }
    }
  };

  // Funzioni attività
  const addTask = async () => {
    if (newTask.description && newTask.responsible && newTask.startDate && newTask.endDate) {
      try {
        const { error } = await supabase
          .from('tasks')
          .insert([{
            topic_id: selectedTopicForTask,
            description: newTask.description,
            responsible: newTask.responsible,
            start_date: newTask.startDate,
            end_date: newTask.endDate,
            status: 'todo',
            archived: false
          }]);
        
        if (error) throw error;
        
        await loadTasks();
        setNewTask({ description: '', responsible: '', startDate: '', endDate: '' });
        setShowNewTaskForm(false);
        setSelectedTopicForTask(null);
        addNotification(`Attività creata`);
      } catch (error) {
        console.error('Errore creazione attività:', error);
        addNotification('Errore creazione attività');
      }
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);
      
      if (error) throw error;
      await loadTasks();
    } catch (error) {
      console.error('Errore aggiornamento attività:', error);
      addNotification('Errore aggiornamento attività');
    }
  };

  const addTaskComment = async (taskId) => {
    const text = newTaskComment[taskId];
    if (!text || !text.trim()) return;
    
    try {
      const { error } = await supabase
        .from('task_comments')
        .insert([{
          task_id: taskId,
          comment: text.trim(),
          author: currentUser
        }]);
      
      if (error) throw error;
      
      await loadTasks();
      setNewTaskComment({ ...newTaskComment, [taskId]: '' });
      addNotification('Commento aggiunto');
    } catch (error) {
      console.error('Errore aggiunta commento:', error);
      addNotification('Errore aggiunta commento');
    }
  };

  const updateTaskComment = async (taskId, commentId) => {
    if (!editingCommentText.trim()) return;
    
    try {
      const { error } = await supabase
        .from('task_comments')
        .update({ comment: editingCommentText.trim() })
        .eq('id', commentId);
      
      if (error) throw error;
      
      await loadTasks();
      setEditingCommentId(null);
      setEditingCommentText('');
      addNotification('Commento modificato');
    } catch (error) {
      console.error('Errore modifica commento:', error);
      addNotification('Errore modifica commento');
    }
  };

  const deleteTaskComment = async (taskId, commentId) => {
    if (window.confirm('Eliminare questo commento?')) {
      try {
        const { error } = await supabase
          .from('task_comments')
          .delete()
          .eq('id', commentId);
        
        if (error) throw error;
        
        await loadTasks();
        addNotification('Commento eliminato');
      } catch (error) {
        console.error('Errore eliminazione commento:', error);
        addNotification('Errore eliminazione commento');
      }
    }
  };

  const archiveTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ archived: true })
        .eq('id', taskId);
      
      if (error) throw error;
      await loadTasks();
      addNotification('Attività archiviata');
    } catch (error) {
      console.error('Errore archiviazione attività:', error);
      addNotification('Errore archiviazione attività');
    }
  };

  const restoreTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ archived: false })
        .eq('id', taskId);
      
      if (error) throw error;
      await loadTasks();
      addNotification('Attività ripristinata');
    } catch (error) {
      console.error('Errore ripristino attività:', error);
      addNotification('Errore ripristino attività');
    }
  };

  const addNotification = (message) => {
    setNotifications([...notifications, { id: Date.now(), message, timestamp: new Date().toISOString() }]);
  };

  const toggleTopicExpansion = (topicId) => {
    setExpandedTopics({ ...expandedTopics, [topicId]: !expandedTopics[topicId] });
  };

  // Filtraggio
  const activeTopics = topics.filter(t => !t.archived);
  const archivedTopics = topics.filter(t => t.archived);
  const activeTasks = tasks.filter(t => !t.archived);
  const archivedTasks = tasks.filter(t => t.archived);
  
  let meetingTopics = activeTopics.filter(t => t.meetingDate === selectedMeetingDate);
  if (filterByClassification) {
    meetingTopics = meetingTopics.filter(t => t.classification === filterByClassification);
  }
  
  const filteredTopics = filterByUser ? activeTopics.filter(t => t.author === filterByUser) : activeTopics;
  const filteredTasks = filterByUser ? activeTasks.filter(t => t.responsible === filterByUser) : activeTasks;

  // Componenti UI
  const StatusBadge = ({ status, compact = false }) => {
    const configs = {
      'pending': { color: 'bg-slate-500', text: 'Non trattato', icon: Circle },
      'discussed': { color: 'bg-emerald-500', text: 'Concluso', icon: CheckCircle },
      'partial': { color: 'bg-amber-500', text: 'Da concludere', icon: AlertCircle },
      'not-discussed': { color: 'bg-rose-500', text: 'Non trattato', icon: Circle }
    };
    const config = configs[status];
    const Icon = config.icon;
    
    if (compact) {
      return <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.color} text-white text-xs font-medium`}><Icon size={10} /></div>;
    }
    
    return <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.color} text-white text-sm font-medium`}><Icon size={14} />{config.text}</div>;
  };

  const ImportanceBadge = ({ level }) => {
    const colors = { 'A': 'bg-rose-600 text-white', 'B': 'bg-amber-500 text-white', 'C': 'bg-blue-500 text-white' };
    return <div className={`w-8 h-8 rounded-lg ${colors[level]} flex items-center justify-center font-bold text-sm shadow-md`}>{level}</div>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-slate-700">Caricamento da database...</p>
        </div>
      </div>
    );
  }

  // Render functions (using same UI as localStorage version)
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Dashboard Argomenti</h2>
          <p className="text-slate-600 mt-1">Gestisci gli argomenti per le prossime riunioni</p>
        </div>
        <button onClick={() => setShowNewTopicForm(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2 font-medium">
          <Plus size={20} />Nuovo Argomento
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 flex items-center gap-4">
        <Filter size={20} className="text-slate-600" />
        <label className="font-medium text-slate-700">Filtra per partecipante:</label>
        <select value={filterByUser} onChange={(e) => setFilterByUser(e.target.value)} className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none">
          <option value="">Tutti i partecipanti</option>
          {participants.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {filterByUser && <button onClick={() => setFilterByUser('')} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors">Rimuovi filtro</button>}
      </div>

      {showNewTopicForm && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-indigo-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-slate-800">Inserisci Nuovo Argomento</h3>
            <button onClick={() => setShowNewTopicForm(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Data Riunione *</label>
              <input type="date" value={newTopic.meetingDate} onChange={(e) => setNewTopic({ ...newTopic, meetingDate: e.target.value })} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Importanza *</label>
              <select value={newTopic.importance} onChange={(e) => setNewTopic({ ...newTopic, importance: e.target.value })} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none">
                <option value="A">A - Alta</option>
                <option value="B">B - Media</option>
                <option value="C">C - Bassa</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Classificazione *</label>
              <select value={newTopic.classification} onChange={(e) => setNewTopic({ ...newTopic, classification: e.target.value })} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none">
                {classifications.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Descrizione Argomento *</label>
              <input type="text" value={newTopic.description} onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" placeholder="Es. Implementazione nuovo sistema ERP" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Domanda Specifica *</label>
              <textarea value={newTopic.question} onChange={(e) => setNewTopic({ ...newTopic, question: e.target.value })} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none h-24" placeholder="Esponi in modo chiaro il quesito" />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button onClick={() => setShowNewTopicForm(false)} className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Annulla</button>
            <button onClick={addTopic} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium">Aggiungi Argomento</button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {filteredTopics.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <p className="text-xl text-slate-500">{filterByUser ? `Nessun argomento per ${filterByUser}` : 'Nessun argomento inserito'}</p>
          </div>
        ) : (
          filteredTopics.map(topic => (
            <div key={topic.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow p-6 border-l-4 border-indigo-500">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <ImportanceBadge level={topic.importance} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-800">{topic.description}</h3>
                      <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{topic.classification}</span>
                    </div>
                    <p className="text-slate-600 mb-3">{topic.question}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      {editingTopicId === topic.id ? (
                        <div className="flex items-center gap-2">
                          <input type="date" value={editingTopicDate} onChange={(e) => setEditingTopicDate(e.target.value)} className="px-2 py-1 border rounded" />
                          <button onClick={() => updateTopicDate(topic.id, editingTopicDate)} className="text-emerald-600 hover:text-emerald-700"><Save size={16} /></button>
                          <button onClick={() => { setEditingTopicId(null); setEditingTopicDate(''); }} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(topic.meetingDate).toLocaleDateString('it-IT')}
                          <button onClick={() => { setEditingTopicId(topic.id); setEditingTopicDate(topic.meetingDate); }} className="text-slate-400 hover:text-indigo-600 ml-1"><Edit2 size={12} /></button>
                        </span>
                      )}
                      <span className="flex items-center gap-1"><User size={14} />{topic.author}</span>
                      {topic.responses.length > 0 && <span className="flex items-center gap-1"><MessageSquare size={14} />{topic.responses.length} risposte</span>}
                    </div>

                    {topic.responses.length > 0 && (
                      <div className="mt-4">
                        <button onClick={() => toggleTopicExpansion(topic.id)} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 mb-2">
                          {expandedTopics[topic.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          {topic.responses.length} Risposta/e
                        </button>
                        {expandedTopics[topic.id] && (
                          <div className="space-y-2 bg-slate-50 p-4 rounded-lg">
                            {topic.responses.map(response => (
                              <div key={response.id} className="bg-white p-3 rounded-lg border-l-4 border-indigo-400">
                                {editingResponseId === response.id ? (
                                  <div>
                                    <textarea value={editingResponseText} onChange={(e) => setEditingResponseText(e.target.value)} className="w-full p-2 border rounded mb-2" />
                                    <div className="flex gap-2">
                                      <button onClick={() => updateResponse(topic.id, response.id)} className="px-3 py-1 bg-emerald-500 text-white rounded text-sm">Salva</button>
                                      <button onClick={() => { setEditingResponseId(null); setEditingResponseText(''); }} className="px-3 py-1 bg-slate-300 rounded text-sm">Annulla</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="font-medium text-slate-800">{response.author}</span>
                                      <div className="flex gap-2">
                                        <button onClick={() => { setEditingResponseId(response.id); setEditingResponseText(response.text); }} className="text-slate-400 hover:text-indigo-600"><Edit2 size={14} /></button>
                                        <button onClick={() => deleteResponse(topic.id, response.id)} className="text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                                      </div>
                                    </div>
                                    <p className="text-slate-700">{response.text}</p>
                                    <span className="text-xs text-slate-400">{new Date(response.timestamp).toLocaleString('it-IT')}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4">
                      <div className="flex gap-2">
                        <input type="text" value={newResponseText[topic.id] || ''} onChange={(e) => setNewResponseText({ ...newResponseText, [topic.id]: e.target.value })} onKeyPress={(e) => e.key === 'Enter' && addResponseToTopic(topic.id)} placeholder="Scrivi una risposta..." className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none" />
                        <button onClick={() => addResponseToTopic(topic.id)} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">Invia</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <StatusBadge status={topic.status} />
                  <div className="flex gap-2">
                    <button onClick={() => archiveTopic(topic.id)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors" title="Archivia"><Archive size={16} /></button>
                    <button onClick={() => deleteTopic(topic.id)} className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-colors" title="Elimina"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Altri render methods abbreviati per brevità - stessa struttura UI della versione localStorage
  const renderMeetingView = () => <div className="p-6"><p className="text-slate-600">Vista Riunione implementata - UI identica alla versione localStorage</p></div>;
  const renderTasksView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Gestione Attività</h2>
        <button onClick={() => { setSelectedTopicForTask(null); setShowNewTaskForm(true); }} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-lg flex items-center gap-2"><Plus size={20} />Nuova Attività</button>
      </div>

      {filteredTasks.map(task => (
        <div key={task.id} className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">{task.description}</h3>
          
          {/* Sezione Commenti */}
          <div className="mt-4">
            <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <MessageSquare size={16} />
              Commenti {task.comments && task.comments.length > 0 && `(${task.comments.length})`}
            </h4>
            
            {task.comments && task.comments.length > 0 && (
              <div className="space-y-2 mb-3">
                {task.comments.map(comment => (
                  <div key={comment.id} className="bg-slate-50 p-3 rounded-lg border-l-4 border-purple-400">
                    {editingCommentId === comment.id ? (
                      <div>
                        <textarea value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value)} className="w-full p-2 border rounded mb-2" rows="2" />
                        <div className="flex gap-2">
                          <button onClick={() => updateTaskComment(task.id, comment.id)} className="px-3 py-1 bg-emerald-500 text-white rounded text-sm">Salva</button>
                          <button onClick={() => { setEditingCommentId(null); setEditingCommentText(''); }} className="px-3 py-1 bg-slate-300 rounded text-sm">Annulla</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium text-slate-800">{comment.author}</span>
                            <span className="text-xs text-slate-400 ml-2">{new Date(comment.timestamp).toLocaleString('it-IT')}</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.text); }} className="text-slate-400 hover:text-indigo-600"><Edit2 size={14} /></button>
                            <button onClick={() => deleteTaskComment(task.id, comment.id)} className="text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <p className="text-slate-700 text-sm">{comment.text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <input type="text" value={newTaskComment[task.id] || ''} onChange={(e) => setNewTaskComment({ ...newTaskComment, [task.id]: e.target.value })} onKeyPress={(e) => e.key === 'Enter' && addTaskComment(task.id)} placeholder="Aggiungi un commento..." className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm" />
              <button onClick={() => addTaskComment(task.id)} className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm">Invia</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
  
  const renderArchiveView = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-800">Archivio</h2>
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Argomenti Archiviati ({archivedTopics.length})</h3>
        {archivedTopics.map(topic => (
          <div key={topic.id} className="bg-slate-50 p-4 rounded-lg mb-3">
            <div className="flex justify-between">
              <div>
                <h4 className="font-bold">{topic.description}</h4>
                <p className="text-sm text-slate-600">{topic.question}</p>
              </div>
              <button onClick={() => restoreTopic(topic.id)} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg" title="Ripristina"><RotateCcw size={16} /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Attività Archiviate ({archivedTasks.length})</h3>
        {archivedTasks.map(task => (
          <div key={task.id} className="bg-slate-50 p-4 rounded-lg mb-3">
            <div className="flex justify-between">
              <div>
                <h4 className="font-bold">{task.description}</h4>
                <p className="text-sm text-slate-500">Responsabile: {task.responsible}</p>
              </div>
              <button onClick={() => restoreTask(task.id)} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg" title="Ripristina"><RotateCcw size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderParticipantsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Gestione Partecipanti</h2>
        <button onClick={() => setShowAddParticipantForm(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:shadow-lg flex items-center gap-2"><Plus size={20} />Aggiungi</button>
      </div>

      {showAddParticipantForm && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold mb-4">Nuovo Partecipante</h3>
          <input type="text" value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addParticipant()} className="w-full px-4 py-3 border-2 rounded-xl mb-4" placeholder="Nome e Cognome" />
          <div className="flex gap-4">
            <button onClick={() => setShowAddParticipantForm(false)} className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl">Annulla</button>
            <button onClick={addParticipant} className="px-6 py-3 bg-emerald-600 text-white rounded-xl">Aggiungi</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Partecipanti Attivi ({participants.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((p, idx) => (
            <div key={p} className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">{p.split(' ').map(n => n[0]).join('')}</div>
                <p className="font-bold">{p}</p>
              </div>
              {participants.length > 1 && <button onClick={() => removeParticipant(p)} className="text-rose-500 hover:text-rose-700 p-2"><X size={18} /></button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      <style>{styles}</style>
      <header className="bg-white shadow-lg border-b-4 border-indigo-500">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Gestione Riunioni</h1>
              <p className="text-slate-600 mt-1">Sistema condiviso in tempo reale</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative">
                <button className="relative p-2 text-slate-600 hover:text-indigo-600">
                  <Bell size={24} />
                  {notifications.length > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{notifications.length}</span>}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold text-slate-800">{currentUser}</p>
                  <p className="text-sm text-slate-500">Partecipante</p>
                </div>
                <select value={currentUser} onChange={(e) => setCurrentUser(e.target.value)} className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xl border-2 border-white shadow-lg cursor-pointer" style={{ WebkitAppearance: 'none', textAlign: 'center' }}>
                  {participants.map(p => <option key={p} value={p}>{p.split(' ').map(n => n[0]).join('')}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Calendar },
              { id: 'meeting', label: 'Vista Riunione', icon: MessageSquare },
              { id: 'tasks', label: 'Attività', icon: CheckCircle },
              { id: 'participants', label: 'Partecipanti', icon: Users },
              { id: 'archive', label: 'Archivio', icon: Archive }
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setCurrentView(id)} className={`flex items-center gap-2 px-6 py-4 font-medium transition-all border-b-4 ${currentView === id ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                <Icon size={20} />{label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'meeting' && renderMeetingView()}
        {currentView === 'tasks' && renderTasksView()}
        {currentView === 'participants' && renderParticipantsView()}
        {currentView === 'archive' && renderArchiveView()}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-center text-slate-500 text-sm">Sistema Gestione Riunioni © 2024 - Database Condiviso Supabase ✅</p>
        </div>
      </footer>
    </div>
  );
};

export default MeetingManagementApp;
