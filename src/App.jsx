import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Plus, CheckCircle, Circle, AlertCircle, Mic, X, Edit2, Archive, Bell, Filter, Clock, User, MessageSquare, ChevronDown, ChevronUp, Users, Trash2, RotateCcw } from 'lucide-react';

const MeetingManagementApp = () => {
  // Stili CSS personalizzati
  const styles = `
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `;

  // Stati principali
  const [currentUser, setCurrentUser] = useState('Mario Rossi');
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'meeting', 'tasks', 'archive', 'participants'
  const [filterByUser, setFilterByUser] = useState(''); // Filtro per utente
  const [participants, setParticipants] = useState([
    'Mario Rossi',
    'Laura Bianchi',
    'Giuseppe Verdi',
    'Anna Ferrari',
    'Paolo Esposito'
  ]);
  const [showAddParticipantForm, setShowAddParticipantForm] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  
  // Dati
  const [topics, setTopics] = useState([
    {
      id: 1,
      meetingDate: '2024-12-10',
      description: 'Implementazione nuovo sistema ERP',
      importance: 'A',
      question: 'Quale fornitore scegliere per la migrazione?',
      classification: 'Problema con soluzione',
      author: 'Mario Rossi',
      status: 'pending', // 'pending', 'discussed', 'partial', 'not-discussed'
      responses: [],
      archived: false
    },
    {
      id: 2,
      meetingDate: '2024-12-10',
      description: 'Budget Q1 2025',
      importance: 'A',
      question: 'Approvazione budget marketing per il primo trimestre',
      classification: 'Richiesta informazione',
      author: 'Laura Bianchi',
      status: 'pending',
      responses: [],
      archived: false
    }
  ]);
  
  const [tasks, setTasks] = useState([
    {
      id: 1,
      topicId: 1,
      description: 'Valutare tre fornitori ERP e preparare comparativa',
      responsible: 'Laura Bianchi',
      startDate: '2024-12-11',
      endDate: '2024-12-20',
      status: 'in-progress', // 'todo', 'in-progress', 'completed'
      comments: ['Contattati due fornitori'],
      archived: false
    }
  ]);
  
  const [selectedMeetingDate, setSelectedMeetingDate] = useState('2024-12-10');
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [selectedTopicForTask, setSelectedTopicForTask] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTopicId, setRecordingTopicId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [expandedTopics, setExpandedTopics] = useState({});
  const [filterByClassification, setFilterByClassification] = useState(''); // Filtro per classificazione nella vista riunione
  
  // Form states
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

  // Colori per classificazioni
  const classificationColors = {
    'Problema': 'bg-rose-50 border-rose-300',
    'Problema con soluzione': 'bg-amber-50 border-amber-300',
    'Richiesta attività ad altro ente': 'bg-blue-50 border-blue-300',
    'Informazione': 'bg-emerald-50 border-emerald-300',
    'Richiesta informazione': 'bg-purple-50 border-purple-300'
  };

  // Funzioni per gestione partecipanti
  const addParticipant = () => {
    if (newParticipantName.trim() && !participants.includes(newParticipantName.trim())) {
      setParticipants([...participants, newParticipantName.trim()]);
      setNewParticipantName('');
      setShowAddParticipantForm(false);
      addNotification(`Nuovo partecipante aggiunto: ${newParticipantName.trim()}`);
    }
  };

  const removeParticipant = (name) => {
    if (participants.length > 1) {
      setParticipants(participants.filter(p => p !== name));
      addNotification(`Partecipante rimosso: ${name}`);
    }
  };

  // Funzioni per gestione argomenti
  const addTopic = () => {
    if (newTopic.meetingDate && newTopic.description && newTopic.question) {
      const topic = {
        id: Date.now(), // Use timestamp for unique ID
        ...newTopic,
        author: currentUser,
        status: 'pending',
        responses: [],
        archived: false
      };
      setTopics([...topics, topic]);
      setNewTopic({
        meetingDate: '',
        description: '',
        importance: 'B',
        question: '',
        classification: 'Problema'
      });
      setShowNewTopicForm(false);
      addNotification(`Nuovo argomento aggiunto: ${topic.description}`);
    }
  };

  const updateTopicStatus = (topicId, status) => {
    setTopics(topics.map(t => t.id === topicId ? { ...t, status } : t));
  };

  const addResponseToTopic = (topicId, text) => {
    setTopics(topics.map(t => {
      if (t.id === topicId) {
        return {
          ...t,
          responses: [...t.responses, {
            id: t.responses.length + 1,
            text,
            author: currentUser,
            timestamp: new Date().toISOString()
          }]
        };
      }
      return t;
    }));
    addNotification(`Risposta aggiunta all'argomento`);
  };

  // Simulazione registrazione vocale
  const startRecording = (topicId) => {
    setIsRecording(true);
    setRecordingTopicId(topicId);
    // Simulazione: dopo 3 secondi, ferma la registrazione
    setTimeout(() => {
      stopRecording('Questa è una trascrizione simulata della registrazione vocale. In produzione, qui apparirebbe il testo trascritto dal servizio di speech-to-text.');
    }, 3000);
  };

  const stopRecording = (transcription) => {
    if (recordingTopicId) {
      addResponseToTopic(recordingTopicId, transcription);
    }
    setIsRecording(false);
    setRecordingTopicId(null);
  };

  // Funzioni per gestione attività
  const addTask = () => {
    if (newTask.description && newTask.responsible && newTask.startDate && newTask.endDate) {
      const task = {
        id: Date.now(), // Use timestamp for unique ID
        topicId: selectedTopicForTask,
        ...newTask,
        status: 'todo',
        comments: [],
        archived: false
      };
      setTasks([...tasks, task]);
      setNewTask({
        description: '',
        responsible: '',
        startDate: '',
        endDate: ''
      });
      setShowNewTaskForm(false);
      setSelectedTopicForTask(null);
      addNotification(`Nuova attività assegnata a ${task.responsible}`);
    }
  };

  const updateTaskStatus = (taskId, status) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const addTaskComment = (taskId, comment) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, comments: [...t.comments, comment] };
      }
      return t;
    }));
  };

  const archiveTopic = (topicId) => {
    setTopics(topics.map(t => t.id === topicId ? { ...t, archived: true } : t));
    addNotification('Argomento archiviato');
  };

  const restoreTopic = (topicId) => {
    setTopics(topics.map(t => t.id === topicId ? { ...t, archived: false } : t));
    addNotification('Argomento ripristinato');
  };

  const deleteTopic = (topicId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo argomento? Questa azione non può essere annullata.')) {
      setTopics(topics.filter(t => t.id !== topicId));
      addNotification('Argomento eliminato');
    }
  };

  const archiveTask = (taskId) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, archived: true } : t));
  };

  const addNotification = (message) => {
    setNotifications([...notifications, {
      id: Date.now(),
      message,
      timestamp: new Date().toISOString()
    }]);
  };

  const toggleTopicExpansion = (topicId) => {
    setExpandedTopics({
      ...expandedTopics,
      [topicId]: !expandedTopics[topicId]
    });
  };

  // Filtraggio dati
  const activeTopics = topics.filter(t => !t.archived);
  const archivedTopics = topics.filter(t => t.archived);
  const activeTasks = tasks.filter(t => !t.archived);
  const archivedTasks = tasks.filter(t => t.archived);
  
  // Filtraggio per vista riunione
  let meetingTopics = activeTopics.filter(t => t.meetingDate === selectedMeetingDate);
  if (filterByClassification) {
    meetingTopics = meetingTopics.filter(t => t.classification === filterByClassification);
  }
  
  // Filtraggio per utente
  const filteredTopics = filterByUser 
    ? activeTopics.filter(t => t.author === filterByUser)
    : activeTopics;
  
  const filteredTasks = filterByUser
    ? activeTasks.filter(t => t.responsible === filterByUser)
    : activeTasks;
  
  // Raggruppamento per classificazione
  const topicsByClassification = meetingTopics.reduce((acc, topic) => {
    if (!acc[topic.classification]) {
      acc[topic.classification] = [];
    }
    acc[topic.classification].push(topic);
    return acc;
  }, {});

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
      return (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.color} text-white text-xs font-medium`}>
          <Icon size={10} />
        </div>
      );
    }
    
    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.color} text-white text-sm font-medium`}>
        <Icon size={14} />
        {config.text}
      </div>
    );
  };

  const ImportanceBadge = ({ level }) => {
    const colors = {
      'A': 'bg-rose-600 text-white',
      'B': 'bg-amber-500 text-white',
      'C': 'bg-blue-500 text-white'
    };
    return (
      <div className={`w-8 h-8 rounded-lg ${colors[level]} flex items-center justify-center font-bold text-sm shadow-md`}>
        {level}
      </div>
    );
  };

  // Render Dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Dashboard Argomenti</h2>
          <p className="text-slate-600 mt-1">Gestisci gli argomenti per le prossime riunioni</p>
        </div>
        <button
          onClick={() => setShowNewTopicForm(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2 font-medium"
        >
          <Plus size={20} />
          Nuovo Argomento
        </button>
      </div>

      {/* Filtro per utente */}
      <div className="bg-white rounded-xl shadow-md p-4 flex items-center gap-4">
        <Filter size={20} className="text-slate-600" />
        <label className="font-medium text-slate-700">Filtra per partecipante:</label>
        <select
          value={filterByUser}
          onChange={(e) => setFilterByUser(e.target.value)}
          className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Tutti i partecipanti</option>
          {participants.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {filterByUser && (
          <button
            onClick={() => setFilterByUser('')}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
          >
            Rimuovi filtro
          </button>
        )}
      </div>

      {showNewTopicForm && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-indigo-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-slate-800">Inserisci Nuovo Argomento</h3>
            <button onClick={() => setShowNewTopicForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Data Riunione *</label>
              <input
                type="date"
                value={newTopic.meetingDate}
                onChange={(e) => setNewTopic({ ...newTopic, meetingDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Importanza *</label>
              <select
                value={newTopic.importance}
                onChange={(e) => setNewTopic({ ...newTopic, importance: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              >
                <option value="A">A - Alta</option>
                <option value="B">B - Media</option>
                <option value="C">C - Bassa</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Classificazione *</label>
              <select
                value={newTopic.classification}
                onChange={(e) => setNewTopic({ ...newTopic, classification: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              >
                {classifications.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Descrizione Argomento *</label>
              <input
                type="text"
                value={newTopic.description}
                onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                placeholder="Es. Implementazione nuovo sistema ERP"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Domanda Specifica *</label>
              <textarea
                value={newTopic.question}
                onChange={(e) => setNewTopic({ ...newTopic, question: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none h-24"
                placeholder="Esponi in modo chiaro il quesito da discutere"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => setShowNewTopicForm(false)}
              className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={addTopic}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
            >
              Aggiungi Argomento
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {filteredTopics.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <p className="text-xl text-slate-500">
              {filterByUser ? `Nessun argomento per ${filterByUser}` : 'Nessun argomento inserito'}
            </p>
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
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(topic.meetingDate).toLocaleDateString('it-IT')}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {topic.author}
                    </span>
                    {topic.responses.length > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare size={14} />
                        {topic.responses.length} risposte
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <StatusBadge status={topic.status} />
                <div className="flex gap-2">
                  <button
                    onClick={() => archiveTopic(topic.id)}
                    className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                    title="Archivia argomento"
                  >
                    <Archive size={16} />
                  </button>
                  <button
                    onClick={() => deleteTopic(topic.id)}
                    className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-colors"
                    title="Elimina argomento"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );

  // Render Vista Riunione
  const renderMeetingView = () => {
    const isCompactView = !filterByClassification; // Vista compatta quando non c'è filtro attivo
    
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-2xl p-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-bold mb-2">Vista Riunione</h2>
              <p className="text-slate-300 text-lg">Gestione live della riunione</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-lg font-medium">Data Riunione:</label>
              <input
                type="date"
                value={selectedMeetingDate}
                onChange={(e) => setSelectedMeetingDate(e.target.value)}
                className="px-4 py-3 bg-white text-slate-800 rounded-xl text-lg font-medium border-2 border-slate-600 focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>
        </div>

        {/* Filtro per classificazione */}
        <div className="bg-white rounded-xl shadow-md p-4 flex items-center gap-4">
          <Filter size={20} className="text-slate-600" />
          <label className="font-medium text-slate-700">Filtra per classificazione:</label>
          <select
            value={filterByClassification}
            onChange={(e) => setFilterByClassification(e.target.value)}
            className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Tutte le classificazioni (Vista Compatta)</option>
            {classifications.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {filterByClassification && (
            <button
              onClick={() => setFilterByClassification('')}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Rimuovi filtro
            </button>
          )}
        </div>

        {showNewTaskForm && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Crea Nuova Attività</h3>
              <button onClick={() => {
                setShowNewTaskForm(false);
                setSelectedTopicForTask(null);
              }} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            {selectedTopicForTask && (
              <div className="mb-4 p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-500">
                <p className="text-sm text-slate-600">Attività collegata all'argomento:</p>
                <p className="font-bold text-slate-800">
                  {topics.find(t => t.id === selectedTopicForTask)?.description}
                </p>
              </div>
            )}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Descrizione Attività *</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none h-24"
                  placeholder="Descrivi l'attività da completare"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Responsabile *</label>
                <select
                  value={newTask.responsible}
                  onChange={(e) => setNewTask({ ...newTask, responsible: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Seleziona responsabile</option>
                  { participants.map(user => <option key={user} value={user}>{user}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Data Inizio *</label>
                  <input
                    type="date"
                    value={newTask.startDate}
                    onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Data Fine *</label>
                  <input
                    type="date"
                    value={newTask.endDate}
                    onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowNewTaskForm(false);
                  setSelectedTopicForTask(null);
                }}
                className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={addTask}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
              >
                Crea Attività
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-slate-800">
              Argomenti in Discussione ({meetingTopics.length})
            </h3>
            {isRecording && (
              <div className="flex items-center gap-3 bg-rose-50 text-rose-700 px-4 py-2 rounded-xl border-2 border-rose-200">
                <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Registrazione in corso...</span>
              </div>
            )}
          </div>

          {meetingTopics.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-slate-500">
                {filterByClassification 
                  ? `Nessun argomento con classificazione "${filterByClassification}"` 
                  : 'Nessun argomento per questa data'}
              </p>
            </div>
          ) : isCompactView ? (
            // VISTA COMPATTA - Senza filtro attivo
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meetingTopics.map(topic => (
                <div 
                  key={topic.id} 
                  className={`${classificationColors[topic.classification]} rounded-xl p-4 border-2 hover:shadow-lg transition-all cursor-pointer`}
                  onClick={() => {
                    setFilterByClassification(topic.classification);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <ImportanceBadge level={topic.importance} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2">{topic.description}</h4>
                      <p className="text-xs text-slate-600 mb-2 line-clamp-2">{topic.question}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-white bg-opacity-70 px-2 py-1 rounded-full text-slate-700 font-medium">
                      {topic.classification}
                    </span>
                    <StatusBadge status={topic.status} compact={true} />
                  </div>
                  
                  <div className="mt-2 text-xs text-slate-600 flex items-center gap-1">
                    <User size={12} />
                    {topic.author}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // VISTA ESPANSA - Con filtro attivo
            <div className="space-y-6">
              <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-4 mb-6">
                <h4 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                  <Filter size={20} />
                  {filterByClassification} ({meetingTopics.length})
                </h4>
              </div>

              {meetingTopics.map(topic => (
                <div key={topic.id} className={`${classificationColors[topic.classification]} rounded-xl p-6 border-2 hover:border-indigo-400 transition-all`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-4 flex-1">
                      <ImportanceBadge level={topic.importance} />
                      <div className="flex-1">
                        <h5 className="text-2xl font-bold text-slate-800 mb-2">{topic.description}</h5>
                        <p className="text-lg text-slate-700 mb-3 bg-white bg-opacity-50 p-4 rounded-lg border-l-4 border-indigo-400">
                          <strong>Domanda:</strong> {topic.question}
                        </p>
                        <div className="text-sm text-slate-600">
                          <User size={14} className="inline mr-1" />
                          {topic.author}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => archiveTopic(topic.id)}
                        className="p-2 bg-white bg-opacity-70 text-slate-600 rounded-lg hover:bg-white hover:bg-opacity-100 transition-colors"
                        title="Archivia argomento"
                      >
                        <Archive size={18} />
                      </button>
                      <button
                        onClick={() => deleteTopic(topic.id)}
                        className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-colors"
                        title="Elimina argomento"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={() => updateTopicStatus(topic.id, 'discussed')}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        topic.status === 'discussed'
                          ? 'bg-emerald-500 text-white shadow-lg scale-105'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <CheckCircle size={18} className="inline mr-2" />
                      Concluso
                    </button>
                    <button
                      onClick={() => updateTopicStatus(topic.id, 'partial')}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        topic.status === 'partial'
                          ? 'bg-amber-500 text-white shadow-lg scale-105'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      <AlertCircle size={18} className="inline mr-2" />
                      Da Concludere
                    </button>
                    <button
                      onClick={() => updateTopicStatus(topic.id, 'not-discussed')}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        topic.status === 'not-discussed'
                          ? 'bg-rose-500 text-white shadow-lg scale-105'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      <Circle size={18} className="inline mr-2" />
                      Non Trattato
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => isRecording ? stopRecording() : startRecording(topic.id)}
                      disabled={isRecording && recordingTopicId !== topic.id}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                        isRecording && recordingTopicId === topic.id
                          ? 'bg-rose-500 text-white'
                          : 'bg-indigo-500 text-white hover:bg-indigo-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Mic size={18} />
                      {isRecording && recordingTopicId === topic.id ? 'Ferma Registrazione' : 'Registra Risposta'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTopicForTask(topic.id);
                        setShowNewTaskForm(true);
                      }}
                      className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      Crea Attività
                    </button>
                  </div>

                  {topic.responses.length > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() => toggleTopicExpansion(topic.id)}
                        className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 mb-2"
                      >
                        {expandedTopics[topic.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        {topic.responses.length} Risposta/e
                      </button>
                      {expandedTopics[topic.id] && (
                        <div className="space-y-2 bg-white bg-opacity-50 p-4 rounded-lg">
                          {topic.responses.map(response => (
                            <div key={response.id} className="bg-white p-4 rounded-lg border-l-4 border-indigo-400 shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-slate-800">{response.author}</span>
                                <span className="text-xs text-slate-500">
                                  {new Date(response.timestamp).toLocaleString('it-IT')}
                                </span>
                              </div>
                              <p className="text-slate-700">{response.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Gestione Attività
  const renderTasksView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Gestione Attività</h2>
          <p className="text-slate-600 mt-1">Monitora e aggiorna lo stato delle attività</p>
        </div>
        <button
          onClick={() => {
            setSelectedTopicForTask(null);
            setShowNewTaskForm(true);
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2 font-medium"
        >
          <Plus size={20} />
          Nuova Attività
        </button>
      </div>

      {/* Filtro per utente */}
      <div className="bg-white rounded-xl shadow-md p-4 flex items-center gap-4">
        <Filter size={20} className="text-slate-600" />
        <label className="font-medium text-slate-700">Filtra per responsabile:</label>
        <select
          value={filterByUser}
          onChange={(e) => setFilterByUser(e.target.value)}
          className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none"
        >
          <option value="">Tutti i responsabili</option>
          {participants.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {filterByUser && (
          <button
            onClick={() => setFilterByUser('')}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
          >
            Rimuovi filtro
          </button>
        )}
      </div>

      {showNewTaskForm && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-slate-800">Crea Nuova Attività</h3>
            <button onClick={() => setShowNewTaskForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Descrizione Attività *</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none h-24"
                placeholder="Descrivi l'attività da completare"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Responsabile *</label>
              <select
                value={newTask.responsible}
                onChange={(e) => setNewTask({ ...newTask, responsible: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
              >
                <option value="">Seleziona responsabile</option>
                { participants.map(user => <option key={user} value={user}>{user}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Data Inizio *</label>
                <input
                  type="date"
                  value={newTask.startDate}
                  onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Data Fine *</label>
                <input
                  type="date"
                  value={newTask.endDate}
                  onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => setShowNewTaskForm(false)}
              className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={addTask}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
            >
              Crea Attività
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <p className="text-xl text-slate-500">
              {filterByUser ? `Nessuna attività per ${filterByUser}` : 'Nessuna attività'}
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
          const topic = topics.find(top => top.id === task.topicId);
          const statusConfig = {
            'todo': { color: 'bg-slate-100 text-slate-700', text: 'Da Fare' },
            'in-progress': { color: 'bg-blue-100 text-blue-700', text: 'In Corso' },
            'completed': { color: 'bg-emerald-100 text-emerald-700', text: 'Completata' }
          };
          
          return (
            <div key={task.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow p-6 border-l-4 border-purple-500">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{task.description}</h3>
                  {topic && (
                    <p className="text-sm text-slate-500 mb-2">
                      Collegato a: <span className="font-medium text-indigo-600">{topic.description}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {task.responsible}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(task.startDate).toLocaleDateString('it-IT')} - {new Date(task.endDate).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusConfig[task.status].color}`}>
                    {statusConfig[task.status].text}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => updateTaskStatus(task.id, 'todo')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    task.status === 'todo' ? 'bg-slate-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Da Fare
                </button>
                <button
                  onClick={() => updateTaskStatus(task.id, 'in-progress')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    task.status === 'in-progress' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  In Corso
                </button>
                <button
                  onClick={() => updateTaskStatus(task.id, 'completed')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    task.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
                >
                  Completata
                </button>
              </div>

              {task.comments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium text-slate-700">Commenti:</h4>
                  {task.comments.map((comment, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700">
                      {comment}
                    </div>
                  ))}
                </div>
              )}

              {task.status === 'completed' && (
                <button
                  onClick={() => archiveTask(task.id)}
                  className="mt-4 w-full py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Archive size={16} />
                  Archivia Attività
                </button>
              )}
            </div>
          );
        })
        )}
      </div>
    </div>
  );

  // Render Archivio
  const renderArchiveView = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-800">Archivio</h2>
      
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Argomenti Archiviati ({archivedTopics.length})</h3>
        {archivedTopics.length === 0 ? (
          <p className="text-center text-slate-500 py-8">Nessun argomento archiviato</p>
        ) : (
          <div className="space-y-3">
            {archivedTopics.map(topic => (
              <div key={topic.id} className="bg-slate-50 p-4 rounded-lg border-l-4 border-slate-300">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-700 mb-1">{topic.description}</h4>
                    <p className="text-sm text-slate-600 mb-2">{topic.question}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{new Date(topic.meetingDate).toLocaleDateString('it-IT')}</span>
                      <span>{topic.author}</span>
                      <span>{topic.classification}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <StatusBadge status={topic.status} />
                    <button
                      onClick={() => restoreTopic(topic.id)}
                      className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                      title="Ripristina argomento"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      onClick={() => deleteTopic(topic.id)}
                      className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-colors"
                      title="Elimina definitivamente"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Attività Archiviate ({archivedTasks.length})</h3>
        {archivedTasks.length === 0 ? (
          <p className="text-center text-slate-500 py-8">Nessuna attività archiviata</p>
        ) : (
          <div className="space-y-3">
            {archivedTasks.map(task => (
              <div key={task.id} className="bg-slate-50 p-4 rounded-lg border-l-4 border-slate-300">
                <h4 className="font-bold text-slate-700">{task.description}</h4>
                <p className="text-sm text-slate-500">Responsabile: {task.responsible}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render Gestione Partecipanti
  const renderParticipantsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Gestione Partecipanti</h2>
          <p className="text-slate-600 mt-1">Gestisci l'elenco dei partecipanti alle riunioni</p>
        </div>
        <button
          onClick={() => setShowAddParticipantForm(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2 font-medium"
        >
          <Plus size={20} />
          Aggiungi Partecipante
        </button>
      </div>

      {showAddParticipantForm && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-emerald-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-slate-800">Nuovo Partecipante</h3>
            <button onClick={() => {
              setShowAddParticipantForm(false);
              setNewParticipantName('');
            }} className="text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nome e Cognome *</label>
            <input
              type="text"
              value={newParticipantName}
              onChange={(e) => setNewParticipantName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              placeholder="Es. Marco Bianchi"
              onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
            />
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => {
                setShowAddParticipantForm(false);
                setNewParticipantName('');
              }}
              className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={addParticipant}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
            >
              Aggiungi
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Partecipanti Attivi ({participants.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((participant, index) => (
            <div key={participant} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border-2 border-slate-200 hover:border-emerald-400 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                    {participant.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{participant}</p>
                    <p className="text-xs text-slate-500">Partecipante #{index + 1}</p>
                  </div>
                </div>
                {participants.length > 1 && (
                  <button
                    onClick={() => removeParticipant(participant)}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                    title="Rimuovi partecipante"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      <style>{styles}</style>
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-indigo-500">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Gestione Riunioni
              </h1>
              <p className="text-slate-600 mt-1">Sistema di gestione riunioni manageriali</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative">
                <button className="relative p-2 text-slate-600 hover:text-indigo-600 transition-colors">
                  <Bell size={24} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold text-slate-800">{currentUser}</p>
                  <p className="text-sm text-slate-500">Partecipante</p>
                </div>
                <select
                  value={currentUser}
                  onChange={(e) => setCurrentUser(e.target.value)}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl border-2 border-white shadow-lg"
                  style={{
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none',
                    backgroundImage: 'none',
                    paddingRight: '0',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                  title="Cambia utente"
                >
                  {participants.map(p => (
                    <option key={p} value={p}>{p.split(' ').map(n => n[0]).join('')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
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
              <button
                key={id}
                onClick={() => setCurrentView(id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all border-b-4 ${
                  currentView === id
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'meeting' && renderMeetingView()}
        {currentView === 'tasks' && renderTasksView()}
        {currentView === 'participants' && renderParticipantsView()}
        {currentView === 'archive' && renderArchiveView()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-center text-slate-500 text-sm">
            Sistema di Gestione Riunioni Manageriali © 2024
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MeetingManagementApp;