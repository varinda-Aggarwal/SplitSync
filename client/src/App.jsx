import { useEffect, useMemo, useState } from 'react'
import './App.css'

const seedContacts = [
  { id: 'c1', name: 'Anita Shah', email: 'anita@example.com', phone: '+91 98765 43210', company: 'Northstar Labs', initial: 'A', color: '#6759d8' },
  { id: 'c2', name: 'Rohan Mehta', email: 'rohan@example.com', phone: '+91 99876 54321', company: 'Pixelworks', initial: 'R', color: '#d86a59' },
  { id: 'c3', name: 'Maya Kapoor', email: 'maya@example.com', phone: '+91 97654 32109', company: 'Studio 24', initial: 'M', color: '#429b83' },
]

const seedFollowUps = [
  { id: 'f1', contact: 'Anita Shah', note: 'Discuss the new product proposal', type: 'meeting', dueAt: new Date(Date.now() + 86400000).toISOString(), status: 'upcoming' },
  { id: 'f2', contact: 'Rohan Mehta', note: 'Share Q4 campaign update', type: 'email', dueAt: new Date(Date.now() + 3 * 86400000).toISOString(), status: 'upcoming' },
  { id: 'f3', contact: 'Maya Kapoor', note: 'Call about partnership renewal', type: 'call', dueAt: new Date(Date.now() - 86400000).toISOString(), status: 'upcoming' },
]

const icons = {
  grid: '▦', users: '♙', clock: '◷', receipt: '▤', bell: '♢', search: '⌕', plus: '+',
  phone: '☎', mail: '✉', calendar: '□', dots: '•••', check: '✓', close: '×', trash: '⌫'
}

function readStore(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
  }).format(new Date(value))
}

function App() {
  const [page, setPage] = useState('Dashboard')
  const [contacts] = useState(() => readStore('splitsync_contacts', seedContacts))
  const [followUps, setFollowUps] = useState(() => readStore('splitsync_followups', seedFollowUps))
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedContact, setSelectedContact] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    localStorage.setItem('splitsync_followups', JSON.stringify(followUps))
  }, [followUps])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    const due = followUps.find((item) =>
      item.status === 'upcoming' &&
      new Date(item.dueAt) <= new Date(Date.now() + 15 * 60 * 1000) &&
      new Date(item.dueAt) >= new Date(Date.now() - 15 * 60 * 1000)
    )
    if (due) new Notification('SplitSync follow-up reminder', {
      body: `${due.contact}: ${due.note}`,
    })
  }, [followUps])

  const visibleFollowUps = useMemo(() => {
    return followUps
      .filter((item) => filter === 'All' || item.status === filter.toLowerCase())
      .filter((item) =>
        `${item.contact} ${item.note} ${item.type}`.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
  }, [followUps, filter, query])

  const stats = useMemo(() => ({
    upcoming: followUps.filter((item) =>
      item.status === 'upcoming' &&
      new Date(item.dueAt) >= new Date() &&
      new Date(item.dueAt) <= new Date(Date.now() + 7 * 86400000)
    ).length,
    overdue: followUps.filter((item) => item.status === 'upcoming' && new Date(item.dueAt) < new Date()).length,
    done: followUps.filter((item) => item.status === 'done').length,
  }), [followUps])

  const notify = (message) => setToast(message)

  const saveFollowUp = (form) => {
    if (editing) {
      setFollowUps((items) => items.map((item) => item.id === editing.id ? { ...item, ...form } : item))
      notify('Follow-up updated')
    } else {
      setFollowUps((items) => [{ id: `f${Date.now()}`, status: 'upcoming', ...form }, ...items])
      notify('Follow-up scheduled')
    }
    setModalOpen(false)
    setEditing(null)
  }

  const updateStatus = (id, status) => {
    setFollowUps((items) => items.map((item) => item.id === id ? { ...item, status } : item))
    notify(status === 'done' ? 'Follow-up marked done' : 'Follow-up cancelled')
  }

  const deleteFollowUp = (id) => {
    setFollowUps((items) => items.filter((item) => item.id !== id))
    notify('Follow-up moved to trash')
  }

  const openNew = (contact = '') => {
    setEditing(null)
    setModalOpen(true)
    setSelectedContact(contact)
  }

  const openEdit = (item) => {
    setEditing(item)
    setModalOpen(true)
  }

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      notify('Browser notifications are not supported')
      return
    }
    const permission = await Notification.requestPermission()
    notify(permission === 'granted' ? 'Browser reminders enabled' : 'Notification permission denied')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">S</span><span>SplitSync</span></div>
        <nav>
          {[
            ['Dashboard', icons.grid],
            ['Contacts', icons.users],
            ['Follow-ups', icons.clock],
            ['Expenses', icons.receipt],
          ].map(([label, icon]) => (
            <button key={label} className={page === label ? 'nav-item active' : 'nav-item'} onClick={() => setPage(label)}>
              <span className="nav-icon">{icon}</span>{label}
              {label === 'Follow-ups' && stats.overdue > 0 && <span className="nav-count">{stats.overdue}</span>}
            </button>
          ))}
        </nav>
        <button className="profile">
          <span className="avatar">NS</span>
          <span><strong>Nishtha Sharma</strong><small>Personal workspace</small></span>
        </button>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">PERSONAL WORKSPACE</p>
            <h1>{page}</h1>
          </div>
          <div className="top-actions">
            <button className="icon-button" title="Enable notifications" onClick={requestNotifications}>{icons.bell}</button>
            <button className="primary-button" onClick={() => openNew()}><span>{icons.plus}</span> New follow-up</button>
          </div>
        </header>

        {page === 'Dashboard' && (
          <Dashboard
            stats={stats}
            followUps={followUps}
            openNew={openNew}
            openEdit={openEdit}
            updateStatus={updateStatus}
            deleteFollowUp={deleteFollowUp}
            setPage={setPage}
          />
        )}
        {page === 'Follow-ups' && (
          <section className="content">
            <div className="toolbar">
              <div className="search"><span>{icons.search}</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search follow-ups..." /></div>
              <div className="filters">
                {['All', 'Upcoming', 'Done', 'Cancelled'].map((name) => (
                  <button key={name} className={filter === name ? 'filter active' : 'filter'} onClick={() => setFilter(name)}>{name}</button>
                ))}
              </div>
            </div>
            <FollowUpList items={visibleFollowUps} openEdit={openEdit} updateStatus={updateStatus} deleteFollowUp={deleteFollowUp} />
          </section>
        )}
        {page === 'Contacts' && (
          <Contacts contacts={contacts} openNew={openNew} />
        )}
        {page === 'Expenses' && <Expenses />}
      </main>

      {modalOpen && (
        <FollowUpModal
          editing={editing}
          contacts={contacts}
          initialContact={selectedContact}
          close={() => { setModalOpen(false); setEditing(null); setSelectedContact(null) }}
          save={saveFollowUp}
        />
      )}
      {toast && <div className="toast"><span>{icons.check}</span>{toast}</div>}
    </div>
  )
}

function Dashboard({ stats, followUps, openNew, openEdit, updateStatus, deleteFollowUp, setPage }) {
  const recent = [...followUps].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)).slice(0, 5)
  return (
    <div className="content dashboard">
      <div className="stats-grid">
        <StatCard label="Due this week" value={stats.upcoming} detail="Next 7 days" tone="purple" />
        <StatCard label="Overdue" value={stats.overdue} detail="Needs attention" tone="coral" />
        <StatCard label="Completed" value={stats.done} detail="All time" tone="green" />
      </div>
      <div className="dashboard-grid">
        <section className="panel follow-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">YOUR SCHEDULE</p><h2>Upcoming follow-ups</h2></div>
            <button className="text-button" onClick={() => setPage('Follow-ups')}>View all →</button>
          </div>
          {recent.length ? <FollowUpList compact items={recent} openEdit={openEdit} updateStatus={updateStatus} deleteFollowUp={deleteFollowUp} /> :
            <div className="empty"><span>{icons.clock}</span><h3>No follow-ups yet</h3><p>Schedule your first reminder.</p><button className="primary-button" onClick={() => openNew()}>Add follow-up</button></div>}
        </section>
        <section className="panel contact-panel">
          <div className="panel-heading"><div><p className="eyebrow">QUICK ACTION</p><h2>Need a reminder?</h2></div></div>
          <div className="reminder-card">
            <div className="calendar-tile"><strong>{new Date().getDate()}</strong><span>{new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date())}</span></div>
            <div><h3>Stay on top of conversations</h3><p>Create a call, meeting, or email reminder.</p></div>
          </div>
          <button className="secondary-button full" onClick={() => openNew()}>{icons.plus} Schedule follow-up</button>
        </section>
      </div>
    </div>
  )
}

function StatCard({ label, value, detail, tone }) {
  return <article className={`stat-card ${tone}`}><div><p>{label}</p><strong>{value}</strong><span>{detail}</span></div><div className="stat-icon">{tone === 'coral' ? '!' : tone === 'green' ? '✓' : '7'}</div></article>
}

function FollowUpList({ items, openEdit, updateStatus, deleteFollowUp, compact = false }) {
  if (!items.length) return <div className="empty small"><h3>No matching follow-ups</h3><p>Try changing the search or filter.</p></div>
  return (
    <div className={compact ? 'follow-list compact' : 'follow-list'}>
      {items.map((item) => {
        const overdue = item.status === 'upcoming' && new Date(item.dueAt) < new Date()
        return (
          <article className="follow-row" key={item.id}>
            <div className={`type-icon ${item.type}`}>{item.type === 'email' ? icons.mail : item.type === 'meeting' ? icons.calendar : item.type === 'call' ? icons.phone : icons.clock}</div>
            <div className="follow-main">
              <div className="follow-title"><h3>{item.contact}</h3><span className={`status ${overdue ? 'overdue' : item.status}`}>{overdue ? 'Overdue' : item.status}</span></div>
              <p>{item.note}</p>
              <span className={overdue ? 'due overdue-text' : 'due'}>{icons.calendar} {formatDate(item.dueAt)} · {item.type}</span>
            </div>
            <div className="row-actions">
              {item.status === 'upcoming' && <button className="done-button" title="Mark done" onClick={() => updateStatus(item.id, 'done')}>{icons.check}</button>}
              <button className="more-button" title="Reschedule" onClick={() => openEdit(item)}>✎</button>
              <button className="more-button" title="Cancel" onClick={() => updateStatus(item.id, 'cancelled')}>×</button>
              <button className="more-button delete" title="Delete" onClick={() => deleteFollowUp(item.id)}>{icons.trash}</button>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function FollowUpModal({ editing, contacts, initialContact, close, save }) {
  const [form, setForm] = useState({
    contact: editing?.contact || initialContact || '',
    note: editing?.note || '',
    type: editing?.type || 'call',
    dueAt: editing ? new Date(editing.dueAt).toISOString().slice(0, 16) : new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  })
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <form className="modal" onSubmit={(event) => { event.preventDefault(); if (form.contact && form.note && form.dueAt) save({ ...form, dueAt: new Date(form.dueAt).toISOString() }) }}>
        <div className="modal-heading"><div><p className="eyebrow">{editing ? 'RESCHEDULE' : 'NEW REMINDER'}</p><h2>{editing ? 'Edit follow-up' : 'Schedule follow-up'}</h2></div><button type="button" className="close-button" onClick={close}>{icons.close}</button></div>
        <label>Contact
          <input name="contact" list="contact-list" value={form.contact} onChange={change} placeholder="Search or enter a contact" required />
          <datalist id="contact-list">{contacts.map((contact) => <option key={contact.id} value={contact.name} />)}</datalist>
        </label>
        <label>Note<textarea name="note" value={form.note} onChange={change} placeholder="What would you like to discuss?" required /></label>
        <div className="form-grid">
          <label>Type<select name="type" value={form.type} onChange={change}><option value="call">Call</option><option value="meeting">Meeting</option><option value="email">Email</option><option value="other">Other</option></select></label>
          <label>Due date<input name="dueAt" type="datetime-local" value={form.dueAt} onChange={change} required /></label>
        </div>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={close}>Cancel</button><button className="primary-button" type="submit">{editing ? 'Save changes' : 'Schedule follow-up'}</button></div>
      </form>
    </div>
  )
}

function Contacts({ contacts, openNew }) {
  return (
    <section className="content">
      <div className="toolbar"><div className="search"><span>{icons.search}</span><input placeholder="Search contacts..." /></div></div>
      <div className="contacts-grid">
        {contacts.map((contact) => (
          <article className="contact-card" key={contact.id}>
            <div className="contact-avatar" style={{ background: contact.color }}>{contact.initial}</div>
            <h3>{contact.name}</h3><p>{contact.company}</p>
            <div className="contact-links"><span>{icons.mail} {contact.email}</span><span>{icons.phone} {contact.phone}</span></div>
            <button className="secondary-button full" onClick={() => openNew(contact.name)}>Add follow-up</button>
          </article>
        ))}
      </div>
    </section>
  )
}

function Expenses() {
  const [expenses] = useState([
    { id: 1, title: 'Team dinner', amount: 3200, paidBy: 'Nishtha', date: '24 Nov' },
    { id: 2, title: 'Cab fare', amount: 840, paidBy: 'Anita', date: '22 Nov' },
  ])
  return (
    <section className="content">
      <div className="stats-grid"><StatCard label="Total spent" value="₹4,040" detail="This month" tone="purple" /><StatCard label="You paid" value="₹3,200" detail="2 expenses" tone="green" /><StatCard label="You owe" value="₹840" detail="1 person" tone="coral" /></div>
      <div className="panel"><div className="panel-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Expenses</h2></div><button className="primary-button">{icons.plus} Add expense</button></div>
        {expenses.map((expense) => <article className="expense-row" key={expense.id}><div className="expense-icon">{icons.receipt}</div><div><h3>{expense.title}</h3><p>Paid by {expense.paidBy} · {expense.date}</p></div><strong>₹{expense.amount.toLocaleString('en-IN')}</strong></article>)}
      </div>
    </section>
  )
}

export default App
