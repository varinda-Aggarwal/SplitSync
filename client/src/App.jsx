import { useEffect, useMemo, useRef, useState } from 'react'
import FollowupSection from './components/FollowupSection.jsx'
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
  grid: '▦', users: '♙', clock: '◷', bell: '♢', plus: '+',
  phone: '☎', mail: '✉', check: '✓'
}

function readStore(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function App() {
  const [page, setPage] = useState('Dashboard')
  const [contacts] = useState(() => readStore('splitsync_contacts', seedContacts))
  const [followUps, setFollowUps] = useState(() => readStore('splitsync_followups', seedFollowUps))
  const [selectedContact, setSelectedContact] = useState(null)
  const [toast, setToast] = useState('')
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (!('Notification' in window)) return 'unsupported'
    return Notification.permission
  })
  const followUpsRef = useRef(followUps)
  const notifiedReminders = useRef(new Set(readStore('splitsync_notified_reminders', [])))

  useEffect(() => {
    localStorage.setItem('splitsync_followups', JSON.stringify(followUps))
    followUpsRef.current = followUps
  }, [followUps])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (notificationPermission !== 'granted') return

    const checkReminders = () => {
      const now = Date.now()
      const dueReminders = followUpsRef.current.filter((item) => {
        const id = item.id || item._id
        const reminderKey = `${id}:${new Date(item.dueAt).getTime()}`
        return item.status === 'upcoming' &&
          new Date(item.dueAt).getTime() <= now &&
          !notifiedReminders.current.has(reminderKey)
      })

      dueReminders.forEach((item) => {
        const id = item.id || item._id
        const reminderKey = `${id}:${new Date(item.dueAt).getTime()}`
        new Notification('SplitSync follow-up reminder', {
          body: `${item.contact}: ${item.note}`,
          tag: reminderKey,
        })
        notifiedReminders.current.add(reminderKey)
      })

      if (dueReminders.length) {
        localStorage.setItem(
          'splitsync_notified_reminders',
          JSON.stringify([...notifiedReminders.current])
        )
      }
    }

    checkReminders()
    const intervalId = window.setInterval(checkReminders, 60_000)
    return () => window.clearInterval(intervalId)
  }, [notificationPermission])

  const stats = useMemo(() => {
    const now = new Date()
    const endOfToday = new Date(now)
    endOfToday.setHours(23, 59, 59, 999)
    const active = followUps.filter((item) => item.status === 'upcoming')

    return {
      dueToday: active.filter((item) => {
        const dueAt = new Date(item.dueAt)
        return dueAt >= now && dueAt <= endOfToday
      }).length,
      upcoming: active.filter((item) => new Date(item.dueAt) > endOfToday).length,
      overdue: active.filter((item) => new Date(item.dueAt) < now).length,
      items: [...active].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)),
    }
  }, [followUps])

  const notify = (message) => setToast(message)

  const saveFollowUp = (form, editingId) => {
    if (editingId) {
      setFollowUps((items) => items.map((item) =>
        (item.id || item._id) === editingId ? { ...item, ...form } : item
      ))
      notify('Follow-up updated')
    } else {
      setFollowUps((items) => [{ id: `f${Date.now()}`, status: 'upcoming', ...form }, ...items])
      notify('Follow-up scheduled')
    }
  }

  const updateStatus = (id, status) => {
    setFollowUps((items) => items.map((item) =>
      (item.id || item._id) === id ? { ...item, status } : item
    ))
    notify(status === 'done' ? 'Follow-up marked done' : 'Follow-up cancelled')
  }

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      notify('Browser notifications are not supported')
      return
    }
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
    notify(permission === 'granted' ? 'Browser reminders enabled' : 'Notification permission denied')
  }

  const openContact = (contact) => {
    setSelectedContact(contact)
    setPage('Contact Details')
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
            <button className="notification-button" onClick={requestNotifications}>
              <span>{icons.bell}</span>
              {notificationPermission === 'granted' ? 'Reminders on' : 'Enable reminders'}
            </button>
            <button className="primary-button" onClick={() => setPage('Follow-ups')}>View follow-ups</button>
          </div>
        </header>

        {page === 'Dashboard' && (
          <Dashboard
            stats={stats}
            contacts={contacts}
            onCreate={saveFollowUp}
            onUpdateStatus={updateStatus}
            onViewAll={() => setPage('Follow-ups')}
            onOpenContact={openContact}
          />
        )}
        {page === 'Follow-ups' && (
          <section className="content">
            <FollowupSection
              contacts={contacts}
              items={followUps}
              onCreate={saveFollowUp}
              onUpdateStatus={updateStatus}
            />
          </section>
        )}
        {page === 'Contacts' && (
          <Contacts contacts={contacts} onOpenContact={openContact} />
        )}
        {page === 'Contact Details' && selectedContact && (
          <ContactDetails
            contact={selectedContact}
            contacts={contacts}
            items={followUps.filter((item) => item.contact === selectedContact.name)}
            onCreate={saveFollowUp}
            onUpdateStatus={updateStatus}
            onBack={() => setPage('Contacts')}
          />
        )}
      </main>
      {toast && <div className="toast"><span>{icons.check}</span>{toast}</div>}
    </div>
  )
}

function Dashboard({ stats, contacts, onCreate, onUpdateStatus, onViewAll, onOpenContact }) {
  return (
    <div className="content dashboard">
      <div className="stats-grid">
        <StatCard label="Due today" value={stats.dueToday} detail="Scheduled for today" tone="purple" />
        <StatCard label="Upcoming" value={stats.upcoming} detail="After today" tone="green" />
        <StatCard label="Overdue" value={stats.overdue} detail="Needs attention" tone="coral" />
      </div>
      <section className="panel follow-panel">
        <div className="panel-heading">
          <div><p className="eyebrow">YOUR SCHEDULE</p><h2>Follow-ups</h2></div>
          <button className="text-button" onClick={onViewAll}>View all →</button>
        </div>
        <FollowupSection
          compact
          showScheduleButton
          contacts={contacts}
          items={stats.items.slice(0, 5)}
          onCreate={onCreate}
          onUpdateStatus={onUpdateStatus}
        />
      </section>
      <section className="panel reminder-panel">
        <div className="panel-heading">
          <div><p className="eyebrow">CONTACTS</p><h2>Open a contact to manage follow-ups</h2></div>
          <button className="text-button" onClick={() => onOpenContact(contacts[0])}>View contact →</button>
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value, detail, tone }) {
  const icon = tone === 'coral' ? '!' : tone === 'green' ? '✓' : '◷'
  return (
    <article className={`stat-card ${tone}`}>
      <div><p>{label}</p><strong>{value}</strong><span>{detail}</span></div>
      <div className="stat-icon">{icon}</div>
    </article>
  )
}

function Contacts({ contacts, onOpenContact }) {
  return (
    <section className="content">
      <div className="contacts-grid">
        {contacts.map((contact) => (
          <article className="contact-card" key={contact.id}>
            <div className="contact-avatar" style={{ background: contact.color }}>{contact.initial}</div>
            <h3>{contact.name}</h3><p>{contact.company}</p>
            <div className="contact-links"><span>{icons.mail} {contact.email}</span><span>{icons.phone} {contact.phone}</span></div>
            <button className="secondary-button full" onClick={() => onOpenContact(contact)}>View details &amp; follow-ups</button>
          </article>
        ))}
      </div>
    </section>
  )
}

function ContactDetails({ contact, contacts, items, onCreate, onUpdateStatus, onBack }) {
  return (
    <section className="content contact-details">
      <button className="text-button back-button" onClick={onBack}>← Back to contacts</button>
      <div className="contact-detail-card">
        <div className="contact-avatar" style={{ background: contact.color }}>{contact.initial}</div>
        <div><h2>{contact.name}</h2><p>{contact.company}</p></div>
        <div className="contact-links"><span>{icons.mail} {contact.email}</span><span>{icons.phone} {contact.phone}</span></div>
      </div>
      <section className="panel follow-panel">
        <div className="panel-heading"><div><p className="eyebrow">CONTACT DETAILS</p><h2>Follow-ups with {contact.name}</h2></div></div>
        <FollowupSection
          contacts={contacts}
          items={items}
          initialContact={contact.name}
          onCreate={onCreate}
          onUpdateStatus={onUpdateStatus}
        />
      </section>
    </section>
  )
}

export default App
